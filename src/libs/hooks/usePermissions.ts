import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { AppRole, ChurchRole, UserRole } from '@/libs/utils/auth';
import { VolunteerRole } from '@/libs/models/Volunteer';

/**
 * Hook to resolve unified roles and semantic permissions for the authenticated user.
 * Combines persisted account roles (`user.roles`), active operational role switch (`currentRole`),
 * and active volunteer assignment (`activeVolunteerRole`).
 *
 * @returns Unified roles, helper check methods, and semantic authorization flags.
 */
export const usePermissions = () => {
  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const activeVolunteerRole = useAppSelector(
    (state) => state.volunteerContextSlice.activeVolunteerRole,
  );

  const userRoles = useMemo(() => (user?.roles as AppRole[]) || [], [user?.roles]);

  const activeRoles = useMemo(() => {
    const roles = new Set<AppRole>(userRoles);
    if (currentRole) roles.add(currentRole as AppRole);
    return roles;
  }, [userRoles, currentRole]);

  const hasRole = useCallback(
    (...roles: AppRole[]) => roles.some((role) => activeRoles.has(role)),
    [activeRoles],
  );

  const hasVolunteerRole = useCallback(
    (...roles: VolunteerRole[]) => !!activeVolunteerRole && roles.includes(activeVolunteerRole),
    [activeVolunteerRole],
  );

  const isSuperAdmin = activeRoles.has(UserRole.SUPER_ADMIN);
  const isAdmin = hasRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);
  const isStaff = isAdmin || activeRoles.has(UserRole.STAFF);
  const isMinistryAdmin = isAdmin || activeRoles.has(ChurchRole.MINISTRY_ADMIN);

  const isAreaCoordinator =
    isMinistryAdmin ||
    hasRole(ChurchRole.KID_REGISTER_COORDINATOR) ||
    hasVolunteerRole(
      VolunteerRole.AREA_GENERAL_COORDINATOR,
      VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );

  const isGroupCoordinator =
    isAreaCoordinator ||
    hasRole(ChurchRole.KID_CHURCH_GROUP_COORDINATOR) ||
    hasVolunteerRole(VolunteerRole.GROUP_COORDINATOR);

  const isSupervisor =
    isGroupCoordinator ||
    hasRole(
      ChurchRole.KID_REGISTER_SUPERVISOR,
      ChurchRole.KID_CHURCH_SUPERVISOR,
      ChurchRole.KID_SECURITY_SUPERVISOR,
      ChurchRole.KID_SECURITY_COORDINATOR,
    ) ||
    hasVolunteerRole(VolunteerRole.SUPERVISOR);

  const isServidor =
    hasRole(
      ChurchRole.KID_REGISTER_USER,
      ChurchRole.KID_CHURCH_USER,
      ChurchRole.KID_SECURITY_USER,
    ) || hasVolunteerRole(VolunteerRole.VOLUNTEER);

  const isKidChurchRole =
    isMinistryAdmin ||
    hasRole(
      ChurchRole.KID_CHURCH_GROUP_COORDINATOR,
      ChurchRole.KID_CHURCH_SUPERVISOR,
      ChurchRole.KID_CHURCH_USER,
    ) ||
    hasVolunteerRole(
      VolunteerRole.GROUP_COORDINATOR,
      VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );

  const isKidRegistrationRole =
    !isKidChurchRole &&
    (hasRole(
      ChurchRole.KID_REGISTER_COORDINATOR,
      ChurchRole.KID_REGISTER_SUPERVISOR,
      ChurchRole.KID_REGISTER_USER,
      ChurchRole.KID_SECURITY_COORDINATOR,
      ChurchRole.KID_SECURITY_SUPERVISOR,
      ChurchRole.KID_SECURITY_USER,
      UserRole.USER,
    ) ||
      hasVolunteerRole(
        VolunteerRole.AREA_GENERAL_COORDINATOR,
        VolunteerRole.VOLUNTEER,
      ));

  const canViewTeam =
    !isServidor &&
    (isSupervisor ||
      hasRole(ChurchRole.MINISTRY_ADMIN) ||
      hasVolunteerRole(
        VolunteerRole.AREA_GENERAL_COORDINATOR,
        VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
      ));

  const canViewCreatorInfo = isAreaCoordinator;
  const canViewRegistrationLog = isSupervisor;

  return {
    user,
    currentRole,
    activeVolunteerRole,
    userRoles,
    activeRoles,
    hasRole,
    hasVolunteerRole,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isMinistryAdmin,
    isAreaCoordinator,
    isGroupCoordinator,
    isSupervisor,
    isServidor,
    isKidChurchRole,
    isKidRegistrationRole,
    canViewTeam,
    canViewCreatorInfo,
    canViewRegistrationLog,
  };
};
