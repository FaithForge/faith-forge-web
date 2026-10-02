import React from 'react';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { UserExperienceEnum, UserRole } from '@/libs/utils/auth';
import AdminLayout from '@/components/layout/AdminLayout';
import KidGuardianLayout from '@/components/layout/KidGuardianLayout';
import MainLayout from '@/components/layout/MainLayout';
import ProfileView from './ProfileView';

/**
 * Route shell that mounts ProfileView inside the user's active experience layout
 * (AdminLayout, KidGuardianLayout, or MainLayout), preserving the existing TopBar.
 *
 * @returns {JSX.Element} Rendered profile page with surrounding active layout.
 */
const ProfileRoute: React.FC = () => {
  const activeExperience = useAppSelector((state) => state.authSlice.activeExperience);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const user = useAppSelector((state) => state.authSlice.user);

  const isAdmin =
    activeExperience === UserExperienceEnum.ADMIN ||
    (!activeExperience &&
      (currentRole === UserRole.SUPER_ADMIN ||
        currentRole === UserRole.ADMIN ||
        currentRole === UserRole.STAFF ||
        user?.roles?.includes(UserRole.SUPER_ADMIN as any) ||
        user?.roles?.includes(UserRole.ADMIN as any) ||
        user?.roles?.includes(UserRole.STAFF as any)));

  const isGuardian = activeExperience === UserExperienceEnum.KID_GUARDIAN;

  if (isAdmin) {
    return (
      <AdminLayout>
        <ProfileView />
      </AdminLayout>
    );
  }

  if (isGuardian) {
    return (
      <KidGuardianLayout>
        <ProfileView />
      </KidGuardianLayout>
    );
  }

  return (
    <MainLayout>
      <ProfileView />
    </MainLayout>
  );
};

export default ProfileRoute;
