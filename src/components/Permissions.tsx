/* eslint-disable @typescript-eslint/no-explicit-any */
import { RootState } from '@/libs/state/redux';
import { UserRole } from '@/libs/utils/auth';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

export function useHasRequiredPermissions(requiredPermissions: UserRole[]): boolean {
  const { user } = useSelector((state: RootState) => state.authSlice);
  const userPermissions = user?.roles as UserRole[];
  if (userPermissions) {
    return requiredPermissions.some((permission) => userPermissions.includes(permission));
  }
  return false;
}

export function withRoles(Component: any, requiredPermissions: UserRole[]) {
  return function WithRolesWrapper(props: any) {
    const router = useRouter();
    const hasPermission = useHasRequiredPermissions(requiredPermissions);
    if (hasPermission) {
      return <Component {...props} />;
    } else {
      router.push('/');
      return null;
    }
  };
}
