import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import RegistrationDashboard from '@/views/kid-registration/RegistrationDashboard';
import NewKidView from '@/views/kid-registration/NewKidView';
import ScannerView from '@/views/kid-registration/ScannerView';
import KidCheckInView from '@/views/kid-registration/KidCheckInView';
import { APP_ROUTES } from "@/config/routes";
import LoginView from '@/views/auth/LoginView';
import ScrollToTop from '@/components/layout/ScrollToTop';

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path={APP_ROUTES.auth.login} element={<LoginView />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to={APP_ROUTES.kidRegistration.root} replace />} />
            <Route path={APP_ROUTES.kidRegistration.root} element={<RegistrationDashboard />} />
            <Route path={APP_ROUTES.kidRegistration.new} element={<NewKidView />} />
            <Route path={APP_ROUTES.kidRegistration.checkInDynamic} element={<KidCheckInView />} />
            <Route path={APP_ROUTES.scanner.root} element={<ScannerView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
