import React, { Suspense } from 'react';
import { usePermissions } from '@/libs/hooks/usePermissions';
import PageLoader from '@/components/layout/PageLoader';
import UserRegistrationDashboardView from './views/UserRegistrationDashboardView';
import SupervisorRegistrationDashboardView from './views/SupervisorRegistrationDashboardView';
import CoordinatorRegistrationDashboardView from './views/CoordinatorRegistrationDashboardView';

/**
 * Dispatcher for the kid registration dashboard.
 * Delegates cleanly to the role-specific view without nested inline conditionals:
 * - Admin / Registration Coordinator -> CoordinatorRegistrationDashboardView (with bypasses)
 * - Registration Supervisor -> SupervisorRegistrationDashboardView (supervision tools, NO bypasses)
 * - Volunteer / Server -> UserRegistrationDashboardView (streamlined check-in, NO bypasses)
 *
 * @returns {JSX.Element} The rendered dashboard tailored to the active role.
 */
const RegistrationDashboardRoute: React.FC = () => {
  const { isSuperAdmin, isAdmin, isAreaCoordinator, isSupervisor } = usePermissions();

  // Coordinators and Admins have bypass permissions
  const isCoordinatorOrAdmin = isSuperAdmin || isAdmin || isAreaCoordinator;

  if (isCoordinatorOrAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <CoordinatorRegistrationDashboardView />
      </Suspense>
    );
  }

  // Supervisors have supervision features but strictly NO bypasses
  if (isSupervisor) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SupervisorRegistrationDashboardView />
      </Suspense>
    );
  }

  // Base volunteer server
  return (
    <Suspense fallback={<PageLoader />}>
      <UserRegistrationDashboardView />
    </Suspense>
  );
};

export default RegistrationDashboardRoute;
