import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { APP_ROUTES } from '@/config/routes';

/**
 * Protects routes that require authentication.
 * Redirects to the login page if no token is found in the Redux store.
 *
 * @returns {JSX.Element} The protected outlet or a redirect to login.
 */
const PrivateRoute = () => {
  const token = useAppSelector((state) => state.authSlice.token);
  return token ? <Outlet /> : <Navigate to={APP_ROUTES.auth.login} replace />;
};

export default PrivateRoute;
