import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { APP_ROUTES } from '@/config/routes';
import RegistrationBottomNav from './RegistrationBottomNav';
import KidChurchBottomNav from './KidChurchBottomNav';

/**
 * Dispatcher for the floating bottom navigation bar.
 * Cleanly separates the two operational workspaces to prevent cross-role conflicts:
 * - When in Kid Church workspace (`/kid-church`) -> Renders KidChurchBottomNav.
 * - Otherwise (Registration, `/kid-registration`) -> Renders RegistrationBottomNav.
 *
 * Hides completely for administrative roles matching AdminLayout behavior.
 *
 * @returns {JSX.Element | null}
 */
const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const { isKidChurchRole } = usePermissions();

  const isAdminRole =
    currentRole === 'ADMIN' ||
    currentRole === 'SUPER_ADMIN' ||
    currentRole === 'STAFF';

  // If admin, hide the bottom navigation bar
  if (isAdminRole) return null;

  // Determine active workspace by route and active role context
  const isKidChurchPath =
    pathname.startsWith(APP_ROUTES.kidChurch.root) ||
    (isKidChurchRole && !pathname.startsWith(APP_ROUTES.kidRegistration.root));

  if (isKidChurchPath) {
    return <KidChurchBottomNav />;
  }

  return <RegistrationBottomNav />;
};

export default BottomNav;
