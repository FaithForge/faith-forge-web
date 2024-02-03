import { UserRole } from '@/utils/auth';
import { useRouter } from 'next/router';

function hasRequiredPermissions(requiredPermissions: UserRole[]): boolean {
  // get userPermissions from the redux-store
  const userPermissions = Object.values(UserRole);
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
