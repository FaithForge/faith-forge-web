import React, { Suspense, lazy } from 'react';
import { usePermissions } from '@/libs/hooks/usePermissions';
import PageLoader from '@/components/layout/PageLoader';

const CoordinatorKidChurchDashboardView = lazy(
  () => import('./views/CoordinatorKidChurchDashboardView'),
);
const KidChurchDashboardView = lazy(() => import('./KidChurchDashboardView'));

/**
 * Route dispatcher for the kids church operational dashboard (`/kid-church`).
 * Delegates cleanly to the role-specific view:
 * - Group Coordinators (`dashboard:view-group-coordinator`) -> CoordinatorKidChurchDashboardView (Recharts metrics, KPI boxes, classroom roster)
 * - Supervisors and Team Members -> KidChurchDashboardView (Classroom supervision roster)
 *
 * @returns {JSX.Element} Rendered role-specific dashboard.
 */
export const KidChurchDashboardRoute: React.FC = () => {
  const { can } = usePermissions();
  const canViewGroupDashboard = can('dashboard:view-group-coordinator');

  if (canViewGroupDashboard) {
    return (
      <Suspense fallback={<PageLoader />}>
        <CoordinatorKidChurchDashboardView />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <KidChurchDashboardView />
    </Suspense>
  );
};

export default KidChurchDashboardRoute;
