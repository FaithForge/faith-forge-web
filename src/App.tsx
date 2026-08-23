import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import RegistrationDashboard from '@/views/kid-registration/RegistrationDashboard';
import NewKidView from '@/views/kid-registration/NewKidView';
import ScannerView from '@/views/kid-registration/ScannerView';
import GenerateGuardianQRView from '@/views/kid-registration/GenerateGuardianQRView';
import KidCheckInView from '@/views/kid-registration/KidCheckInView';
import UpdateKidView from '@/views/kid-registration/UpdateKidView';
import AdminDashboard from '@/views/admin/AdminDashboard';
import KidChurchDashboard from '@/views/kid-church/KidChurchDashboard';
import { APP_ROUTES } from '@/config/routes';
import LoginView from '@/views/auth/LoginView';
import ScrollToTop from '@/components/layout/ScrollToTop';
import PrivateRoute from '@/components/auth/PrivateRoute';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { userRolesNavBarConfig } from '@/components/layout/TopBar';

const IndexRedirect = () => {
  const currentRole = useAppSelector(state => state.authSlice.currentRole);
  
  // Encontrar la URL del dashboard base para el rol actual
  const dashboardUrl = currentRole && userRolesNavBarConfig[currentRole]?.dashboardUrl
    ? userRolesNavBarConfig[currentRole]!.dashboardUrl
    : APP_ROUTES.kidRegistration.root;

  return <Navigate to={dashboardUrl} replace />;
};

function App() {
  return (
    <>
      <Toaster position="top-center" richColors swipeDirections={['top', 'left', 'right']} />
      <BrowserRouter>
        <Routes>
          <Route path={APP_ROUTES.auth.login} element={<LoginView />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<IndexRedirect />} />
              <Route path={APP_ROUTES.admin.root} element={<AdminDashboard />} />
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
