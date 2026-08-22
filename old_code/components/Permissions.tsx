/* eslint-disable @typescript-eslint/no-explicit-any */
import { logout, RootState } from '@/libs/state/redux';
import { UserRole } from '@/libs/utils/auth';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

export function useHasRequiredPermissions(requiredPermissions: UserRole[]): boolean {
  const { user } = useSelector((state: RootState) => state.authSlice);
  const userPermissions = user?.roles as UserRole[];
  if (userPermissions) {
    return _.intersection(requiredPermissions, userPermissions).length > 0;
  }
  return false;
}

export function withRoles(Component: any, requiredPermissions: UserRole[]) {
  return function WithRolesWrapper(props: any) {
    const router = useRouter();
    const dispatch = useDispatch();
    const hasPermission = useHasRequiredPermissions(requiredPermissions);
    if (hasPermission) {
      return <Component {...props} />;
    } else {
      dispatch(logout());
      router.push('/');
      return null;
    }
  };
}
