import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { isTokenExpired } from '@/libs/utils/jwt';
import { AppRole, UserExperienceEnum, UserRole } from '@/libs/utils/auth';
import { isRoleEnabled } from '@/config/roles';
import { APP_ROUTES } from '@/config/routes';
import { toast } from 'sonner';
import NoRolesAssignedView from '@/views/auth/NoRolesAssignedView';

/**
 * Protects routes that require authentication.
 * Redirects to the login page if no valid token is found or if the token has expired.
 * Also checks if the authenticated user has operational roles or kid guardian access assigned;
 * if they have no active experiences, blocks entry and displays a dedicated warning view.
 *
 * @returns {JSX.Element} The protected outlet, a redirect to login, or the no-roles-assigned screen.
 */
const PrivateRoute: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token, refreshToken, user, experiences } = useAppSelector((state) => state.authSlice);
  const expired = isTokenExpired(token);

  useEffect(() => {
    if (token && expired && !refreshToken) {
      dispatch(logout());
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  }, [token, expired, refreshToken, dispatch]);

  if (!token || (expired && !refreshToken)) {
    return <Navigate to={APP_ROUTES.auth.login} replace />;
  }

  const isKidGuardian = experiences?.includes(UserExperienceEnum.KID_GUARDIAN);

  // Verifica si el usuario tiene al menos un rol operativo que esté habilitado con vistas activas
  const hasActiveEnabledRole = user?.roles?.some(
    (role) =>
      role !== UserRole.USER &&
      (role as string) !== 'USER' &&
      isRoleEnabled(role as AppRole)
  );

  if (!hasActiveEnabledRole && !isKidGuardian) {
    return <NoRolesAssignedView />;
  }

  return <Outlet />;
};


export default PrivateRoute;

