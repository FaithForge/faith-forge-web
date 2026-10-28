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
import { GetChurchById, GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
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
const AdminDashboardView = lazy(() => import('@/views/admin/AdminDashboardView'));
const CreateUserView = lazy(() => import('@/views/admin/users/CreateUserView'));
const UserManagementView = lazy(() => import('@/views/admin/users/UserManagementView'));
const UserDetailView = lazy(() => import('@/views/admin/users/UserDetailView'));
const UpdateUserView = lazy(() => import('@/views/admin/users/UpdateUserView'));
const ChurchMeetingsView = lazy(() => import('@/views/admin/meetings/ChurchMeetingsView'));
const CampusesManagementView = lazy(
  () => import('@/views/admin/campuses/CampusesManagementView'),
);
const PrintersManagementView = lazy(
  () => import('@/views/admin/printers/PrintersManagementView'),
);
const MinistriesDirectoryView = lazy(
  () => import('@/views/admin/ministries/MinistriesDirectoryView'),
);
const MinistryWorkspaceView = lazy(
  () => import('@/views/admin/ministries/MinistryWorkspaceView'),
);
const VolunteerDirectoryView = lazy(
  () => import('@/views/admin/volunteers/VolunteerDirectoryView'),
);
const VolunteerApplicationsView = lazy(
  () => import('@/views/admin/volunteers/VolunteerApplicationsView'),
);
const VolunteerRequestPublicView = lazy(
  () => import('@/views/public/VolunteerRequestPublicView'),
);
const AccountSignupPublicView = lazy(
  () => import('@/views/public/AccountSignupPublicView'),
);
const AccountSignupConfirmationView = lazy(
  () => import('@/views/public/AccountSignupConfirmationView'),
);
const TermsOfServiceView = lazy(() => import('@/views/legal/TermsOfServiceView'));
const PrivacyPolicyView = lazy(() => import('@/views/legal/PrivacyPolicyView'));

const ProfileRoute = lazy(() => import('@/views/profile/ProfileRoute'));
const KidChurchDashboardRoute = lazy(
  () => import('@/views/kid-church/KidChurchDashboardRoute'),
);
const MyTeamView = lazy(() => import('@/views/volunteers/MyTeamView'));
const VolunteerAttendanceView = lazy(
  () => import('@/views/volunteers/VolunteerAttendanceView')
);
const ChurchReportsView = lazy(
  () => import('@/views/kid-church/reports/ChurchReportsView')
);
const HubView = lazy(() => import('@/views/hub/HubView'));
const KidGuardianDashboardView = lazy(
  () => import('@/views/kid-guardian/KidGuardianDashboardView')
);
const ChurchesManagementView = lazy(
  () => import('@/views/super-admin/ChurchesManagementView')
);
const MinistryCoordinatorDashboardView = lazy(
  () => import('@/views/ministry-coordinator/views/MinistryCoordinatorDashboardView')
);
import { isFeatureEnabled } from '@/config/features';
import KidGuardianLayout from '@/components/layout/KidGuardianLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import MinistryCoordinatorLayout from '@/components/layout/MinistryCoordinatorLayout';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import NoRolesAssignedView from '@/views/auth/NoRolesAssignedView';
import { AppRole, UserExperienceEnum, UserRole } from '@/libs/utils/auth';
import { FetchMyVolunteerPermissions } from '@/libs/state/redux/thunks/user/auth.thunk';
import {
  resolveTenantHostContext,
  applyChurchBrandingToDom,
  getActiveTenantChurchId,
} from '@/libs/utils/tenant';
import { useResolveChurchTenantQuery } from '@/libs/state/redux/api/churchApi';
import { setChurch } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { useChurchModules } from '@/libs/hooks/useChurchModules';
import { ChurchModule } from '@/libs/models/Church';

/**
 * Route protection wrapper requiring a specific church platform module to be active.
 *
 * @param {object} props - Component props
 * @param {ChurchModule} props.module - Required module enum
 * @param {React.ReactNode} props.children - Child elements to render if module is enabled
 * @returns {JSX.Element} Children or redirection to hub
 */
const ModuleRoute: React.FC<{ module: ChurchModule; children: React.ReactNode }> = ({
  module,
  children,
}) => {
  const { hasModule } = useChurchModules();
  if (!hasModule(module)) {
    return <Navigate to={APP_ROUTES.hub} replace />;
  }
  return <>{children}</>;
};

const IndexRedirect = () => {
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const activeExperience = useAppSelector((state) => state.authSlice.activeExperience);
  const rawExperiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const user = useAppSelector((state) => state.authSlice.user);
  const { hasModule } = useChurchModules();

  const hasKidChurch = hasModule(ChurchModule.KID_CHURCH);
  const experiences = rawExperiences.filter((exp) => {
    if (exp === UserExperienceEnum.KID_CHURCH_STAFF || exp === UserExperienceEnum.KID_GUARDIAN) {
      return hasKidChurch;
    }
    return true;
  });

  const userRoles = (user?.roles || []) as AppRole[];
  const isSuperAdmin = userRoles.includes(UserRole.SUPER_ADMIN);
  const enabledRoles = userRoles.filter(
    (role) => role !== UserRole.USER && (role as string) !== 'USER' && isRoleEnabled(role)
  );
  const isMultiRoleUser =
    experiences.length > 1 ||
    isSuperAdmin ||
    (hasKidChurch && enabledRoles.length > 1);

  // 1. If user has multiple experiences and has not picked an active one, go to Hub
  if (isMultiRoleUser && !activeExperience) {
    return <Navigate to={APP_ROUTES.hub} replace />;
  }

  // 2. Active experience explicitly selected
  if (activeExperience === UserExperienceEnum.MINISTRY_COORDINATOR) {
    return <Navigate to={APP_ROUTES.ministryCoordinator.root} replace />;
  }
  if (activeExperience === UserExperienceEnum.KID_GUARDIAN && hasKidChurch) {
    return <Navigate to={APP_ROUTES.kidGuardian.root} replace />;
  }
  if (activeExperience === UserExperienceEnum.ADMIN) {
    return <Navigate to={APP_ROUTES.admin.root} replace />;
  }
  if (activeExperience === UserExperienceEnum.KID_CHURCH_STAFF && hasKidChurch) {
    const isEnabled = currentRole ? isRoleEnabled(currentRole) : false;
    const roleDashboardUrl =
      isEnabled && currentRole ? userRolesNavBarConfig[currentRole]?.dashboardUrl : null;
    const isOperationalUrl =
      roleDashboardUrl === APP_ROUTES.kidRegistration.root ||
      roleDashboardUrl === APP_ROUTES.kidChurch.root;
    const dashboardUrl = isOperationalUrl ? roleDashboardUrl! : APP_ROUTES.kidRegistration.root;
    return <Navigate to={dashboardUrl} replace />;
  }

  // 3. User with multiple spaces fallback
  if (isMultiRoleUser) {
    return <Navigate to={APP_ROUTES.hub} replace />;
  }

  // 4. Single experience routing
  if (experiences.includes(UserExperienceEnum.MINISTRY_COORDINATOR) && experiences.length === 1) {
    return <Navigate to={APP_ROUTES.ministryCoordinator.root} replace />;
  }
  if (experiences.includes(UserExperienceEnum.KID_GUARDIAN) && !experiences.includes(UserExperienceEnum.KID_CHURCH_STAFF) && !experiences.includes(UserExperienceEnum.ADMIN)) {
    return <Navigate to={APP_ROUTES.kidGuardian.root} replace />;
  }
  if (experiences.includes(UserExperienceEnum.ADMIN) && !experiences.includes(UserExperienceEnum.KID_CHURCH_STAFF) && !experiences.includes(UserExperienceEnum.KID_GUARDIAN)) {
    return <Navigate to={APP_ROUTES.admin.root} replace />;
  }
  if (hasKidChurch && enabledRoles.length > 0) {
    const isEnabled = currentRole ? isRoleEnabled(currentRole) : false;
    const roleDashboardUrl =
      isEnabled && currentRole ? userRolesNavBarConfig[currentRole]?.dashboardUrl : null;
    const isOperationalUrl =
      roleDashboardUrl === APP_ROUTES.kidRegistration.root ||
      roleDashboardUrl === APP_ROUTES.kidChurch.root;
    const dashboardUrl = isOperationalUrl ? roleDashboardUrl! : APP_ROUTES.kidRegistration.root;
    return <Navigate to={dashboardUrl} replace />;
  }

  // 5. Guardian fallback if experiences has KID_GUARDIAN
  if (experiences.includes(UserExperienceEnum.KID_GUARDIAN)) {
    return <Navigate to={APP_ROUTES.kidGuardian.root} replace />;
  }

  // 6. Regular user with no assigned roles or experiences
  return <NoRolesAssignedView />;
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
  const hostContext = resolveTenantHostContext();
  useScreenWakeLock();

  const { data: resolvedTenantChurch } = useResolveChurchTenantQuery(
    {
      slug: hostContext.tenantSlug || undefined,
      host: hostContext.hostname || undefined,
      churchId: import.meta.env.VITE_CHURCH_ID || undefined,
    },
    { skip: hostContext.isSuperAdminHost },
  );

  // Sync resolved church tenant branding and Redux state immediately (even before login)
  useEffect(() => {
    if (hostContext.isSuperAdminHost || !resolvedTenantChurch) return;
    applyChurchBrandingToDom(resolvedTenantChurch);
    dispatch(setChurch(resolvedTenantChurch));
  }, [dispatch, hostContext.isSuperAdminHost, resolvedTenantChurch]);

  // Global bootstrap: Ensure church settings, campuses, and ministries (custom terminology)
  // are loaded as soon as an authenticated session is active.
  useEffect(() => {
    if (!token || hostContext.isSuperAdminHost) return;
    const churchId = resolvedTenantChurch?.id || getActiveTenantChurchId();
    if (churchId) dispatch(GetChurchById(churchId));
    dispatch(GetChurchCampuses());
    dispatch(GetMinistries());
    dispatch(FetchMyVolunteerPermissions());
  }, [dispatch, token, hostContext.isSuperAdminHost, resolvedTenantChurch?.id]);

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

  if (hostContext.isSuperAdminHost) {
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={APP_ROUTES.auth.login} element={<LoginView />} />
              <Route element={<PrivateRoute />}>
                <Route element={<SuperAdminLayout />}>
                  <Route path={APP_ROUTES.superAdmin.root} element={<ChurchesManagementView />} />
                  <Route
                    path={APP_ROUTES.superAdmin.churches}
                    element={<ChurchesManagementView />}
                  />
                  <Route path="*" element={<Navigate to={APP_ROUTES.superAdmin.root} replace />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </>
    );
  }

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
            <Route
              path={APP_ROUTES.public.signup}
              element={
                isFeatureEnabled('guardianSignup') ? (
                  <AccountSignupPublicView />
                ) : (
                  <Navigate to={APP_ROUTES.auth.login} replace />
                )
              }
            />
            <Route
              path={APP_ROUTES.public.signupConfirmation}
              element={
                isFeatureEnabled('guardianSignup') ? (
                  <AccountSignupConfirmationView />
                ) : (
                  <Navigate to={APP_ROUTES.auth.login} replace />
                )
              }
            />
            <Route path={APP_ROUTES.legal.terms} element={<TermsOfServiceView />} />

            <Route path={APP_ROUTES.legal.privacy} element={<PrivacyPolicyView />} />
            <Route element={<PrivateRoute />}>
              {/* Hub: Experience selector */}
              <Route path={APP_ROUTES.hub} element={<HubView />} />
              <Route path={APP_ROUTES.profile} element={<ProfileRoute />} />

              {/* Kid Guardian Experience */}
              <Route
                path={APP_ROUTES.kidGuardian.root}
                element={
                  <ModuleRoute module={ChurchModule.KID_CHURCH}>
                    <KidGuardianLayout />
                  </ModuleRoute>
                }
              >
                <Route index element={<KidGuardianDashboardView />} />
              </Route>

              {/* Admin Experience Layout (Decoupled from Kids Ministry) */}
              <Route element={<AdminLayout />}>
                <Route path={APP_ROUTES.admin.root} element={<AdminDashboardView />} />
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
                  element={<MinistriesDirectoryView />}
                />
                <Route
                  path={APP_ROUTES.admin.ministryDetailDynamic}
                  element={<MinistryWorkspaceView />}
                />
                <Route
                  path={APP_ROUTES.admin.ministrySectionDynamic}
                  element={<MinistryWorkspaceView />}
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

              {/* Ministry Coordinator Experience Layout (Decoupled from Kids Ministry) */}
              <Route element={<MinistryCoordinatorLayout />}>
                <Route
                  path={APP_ROUTES.ministryCoordinator.root}
                  element={<MinistryCoordinatorDashboardView />}
                />
                <Route
                  path={APP_ROUTES.ministryCoordinator.myTeam}
                  element={<MyTeamView />}
                />
              </Route>

              {/* Root redirect: Determines experience cleanly before mounting any layout */}
              <Route path="/" element={<IndexRedirect />} />

              {/* Operational Volunteers Layout (Kids Ministry) */}
              <Route
                element={
                  <ModuleRoute module={ChurchModule.KID_CHURCH}>
                    <MainLayout />
                  </ModuleRoute>
                }
              >
                <Route path={APP_ROUTES.kidChurch.root} element={<KidChurchDashboardRoute />} />
                <Route path={APP_ROUTES.kidChurch.myTeam} element={<MyTeamView />} />
                <Route
                  path={APP_ROUTES.kidChurch.volunteerAttendance}
                  element={<VolunteerAttendanceView />}
                />
                <Route
                  path={APP_ROUTES.kidChurch.reports}
                  element={
                    isFeatureEnabled('churchReports') ? (
                      <ChurchReportsView />
                    ) : (
                      <Navigate to={APP_ROUTES.kidChurch.root} replace />
                    )
                  }
                />
                <Route path={APP_ROUTES.kidRegistration.root} element={<RegistrationDashboard />} />
                <Route path={APP_ROUTES.kidRegistration.myTeam} element={<MyTeamView />} />
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
