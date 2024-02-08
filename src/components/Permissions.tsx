import { RootState } from '@/redux/store';
import { UserRole } from '@/utils/auth';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

const GetUserRoles = () => {
  const { user } = useSelector((state: RootState) => state.authSlice);
  return user?.roles as UserRole[];
};

export function hasRequiredPermissions(
  requiredPermissions: UserRole[],
): boolean {
  // get userPermissions from the redux-store
  const userPermissions = GetUserRoles();
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
}

export function withRoles(Component: any, requiredPermissions: UserRole[]) {
  return function WithRolesWrapper(props: any) {
    const router = useRouter();
    const hasPermission = hasRequiredPermissions(requiredPermissions);
    if (hasPermission) {
      return <Component {...props} />;
    } else {
      router.push('/settings');
      return null;
    }
  };
}
