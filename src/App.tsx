import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import NetworkStatusBanner from '@/components/common/NetworkStatusBanner';
import MainLayout from '@/components/layout/MainLayout';
import RegistrationDashboard from '@/views/kid-registration/RegistrationDashboard';
import NewKidView from '@/views/kid-registration/NewKidView';
import ScannerView from '@/views/kid-registration/ScannerView';
import GenerateGuardianQRView from '@/views/kid-registration/GenerateGuardianQRView';
import KidCheckInView from '@/views/kid-registration/KidCheckInView';
import UpdateKidView from '@/views/kid-registration/UpdateKidView';
import AdminDashboard from '@/views/admin/AdminDashboard';
import CreateUserView from '@/views/admin/users/CreateUserView';
import ModifyUserView from '@/views/admin/users/ModifyUserView';
import AssignUserRolesView from '@/views/admin/users/AssignUserRolesView';
import ChurchMeetingsView from '@/views/admin/ChurchMeetingsView';
import KidChurchDashboard from '@/views/kid-church/KidChurchDashboard';
import { APP_ROUTES } from '@/config/routes';
import LoginView from '@/views/auth/LoginView';
import ScrollToTop from '@/components/layout/ScrollToTop';
import PrivateRoute from '@/components/auth/PrivateRoute';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { userRolesNavBarConfig } from '@/components/layout/TopBar';

const IndexRedirect = () => {
  const currentRole = useAppSelector(state => state.authSlice.currentRole);
  
  // Find the base dashboard URL for the current role
  const dashboardUrl = currentRole && userRolesNavBarConfig[currentRole]?.dashboardUrl
    ? userRolesNavBarConfig[currentRole]!.dashboardUrl
    : APP_ROUTES.kidRegistration.root;

  return <Navigate to={dashboardUrl} replace />;
};

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
      <BrowserRouter>
        <Routes>
          <Route path={APP_ROUTES.auth.login} element={<LoginView />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<IndexRedirect />} />
              <Route path={APP_ROUTES.admin.root} element={<AdminDashboard />} />
              <Route path={APP_ROUTES.admin.createUser} element={<CreateUserView />} />
              <Route path={APP_ROUTES.admin.users} element={<ModifyUserView />} />
              <Route path={APP_ROUTES.admin.userRoles} element={<AssignUserRolesView />} />
              <Route path={APP_ROUTES.admin.churchMeetings} element={<ChurchMeetingsView />} />
              <Route path={APP_ROUTES.kidChurch.root} element={<KidChurchDashboard />} />
              <Route path={APP_ROUTES.kidRegistration.root} element={<RegistrationDashboard />} />
              <Route path={APP_ROUTES.kidRegistration.new} element={<NewKidView />} />
              <Route path={APP_ROUTES.kidRegistration.checkInDynamic} element={<KidCheckInView />} />
              <Route path={APP_ROUTES.kidRegistration.updateKidDynamic} element={<UpdateKidView />} />
              <Route path={APP_ROUTES.kidRegistration.scanner} element={<ScannerView />} />
              <Route path={APP_ROUTES.kidRegistration.generateQR} element={<GenerateGuardianQRView />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
