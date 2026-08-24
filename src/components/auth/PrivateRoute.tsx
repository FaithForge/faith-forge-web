import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { isTokenExpired } from '@/libs/utils/jwt';
import { APP_ROUTES } from '@/config/routes';
import { toast } from 'sonner';

/**
 * Protects routes that require authentication.
 * Redirects to the login page if no valid token is found or if the token has expired.
 *
 * @returns {JSX.Element} The protected outlet or a redirect to login.
 */
const PrivateRoute: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.authSlice.token);
  const expired = isTokenExpired(token);

  useEffect(() => {
    if (token && expired) {
      dispatch(logout());
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  }, [token, expired, dispatch]);

  if (!token || expired) {
    return <Navigate to={APP_ROUTES.auth.login} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;

