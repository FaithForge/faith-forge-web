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
    if (currentRole) {
      return new Set<AppRole>([currentRole as AppRole]);
    }
    return new Set<AppRole>(userRoles);
  }, [userRoles, currentRole]);

  const hasRole = useCallback(
    (...roles: AppRole[]) => roles.some((role) => activeRoles.has(role)),
    [activeRoles],
  );

  const hasVolunteerRole = useCallback(
    (...roles: VolunteerRole[]) => !!activeVolunteerRole && roles.includes(activeVolunteerRole),
    [activeVolunteerRole],
  );

  // An explicit volunteer/server role switch (e.g. Servidor, Servidor - Apoyo, Maestro)
  const isExplicitServidor =
    currentRole === ChurchRole.KID_REGISTER_USER ||
    currentRole === ChurchRole.KID_CHURCH_USER ||
    currentRole === ChurchRole.KID_SECURITY_USER ||
    activeVolunteerRole === VolunteerRole.VOLUNTEER;

  const {
    activeGroupConfigId,
    activeGroupConfigName,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const isApoyoGroup = Boolean(
    activeGroupConfigName?.toLowerCase().includes('apoyo'),
  );

  const hasAssignedGroup = Boolean(
    activeGroupConfigId &&
      activeGroupConfigId !== 'ADMIN_GROUP' &&
      !isApoyoGroup,
  );

  const isSuperAdmin = activeRoles.has(UserRole.SUPER_ADMIN);
  const isAdmin = hasRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);
  const isStaff = isAdmin || activeRoles.has(UserRole.STAFF);
  const isMinistryAdmin = isAdmin || activeRoles.has(ChurchRole.MINISTRY_ADMIN);

  const isAreaCoordinator =
    !isExplicitServidor &&
    (isMinistryAdmin ||
      hasRole(ChurchRole.KID_REGISTER_COORDINATOR) ||
      hasVolunteerRole(
        VolunteerRole.AREA_GENERAL_COORDINATOR,
        VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
      ));

  // A user is classified as 'Apoyo' if they are an operational role without an assigned group,
  // or explicitly assigned to a support group / temporary ad-hoc grant.
  const isApoyo = !isAdmin && !isAreaCoordinator && (!hasAssignedGroup || isApoyoGroup);

  const isGroupCoordinator =
    !isExplicitServidor &&
    (isAreaCoordinator ||
      hasRole(ChurchRole.KID_CHURCH_GROUP_COORDINATOR) ||
      hasVolunteerRole(VolunteerRole.GROUP_COORDINATOR));

  const isSupervisor =
    !isExplicitServidor &&
    (isGroupCoordinator ||
      hasRole(
        ChurchRole.KID_REGISTER_SUPERVISOR,
        ChurchRole.KID_CHURCH_SUPERVISOR,
        ChurchRole.KID_SECURITY_SUPERVISOR,
        ChurchRole.KID_SECURITY_COORDINATOR,
      ) ||
      hasVolunteerRole(VolunteerRole.SUPERVISOR));

  const isServidor =
    isExplicitServidor ||
    (!isSupervisor &&
      (hasRole(
        ChurchRole.KID_REGISTER_USER,
        ChurchRole.KID_CHURCH_USER,
        ChurchRole.KID_SECURITY_USER,
      ) || hasVolunteerRole(VolunteerRole.VOLUNTEER)));

  const isKidChurchRole = useMemo(() => {
    if (currentRole) {
      return (
        currentRole === ChurchRole.MINISTRY_ADMIN ||
        currentRole === ChurchRole.KID_CHURCH_GROUP_COORDINATOR ||
        currentRole === ChurchRole.KID_CHURCH_SUPERVISOR ||
        currentRole === ChurchRole.KID_CHURCH_USER
      );
    }
    if (activeVolunteerRole) {
      return (
        activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR ||
        activeVolunteerRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR
      );
    }
    return (
      activeRoles.has(ChurchRole.MINISTRY_ADMIN) ||
      hasRole(
        ChurchRole.KID_CHURCH_GROUP_COORDINATOR,
        ChurchRole.KID_CHURCH_SUPERVISOR,
        ChurchRole.KID_CHURCH_USER,
      )
    );
  }, [currentRole, activeVolunteerRole, activeRoles, hasRole]);

  const isKidRegistrationRole = useMemo(() => {
    if (currentRole) {
      return (
        currentRole === ChurchRole.KID_REGISTER_COORDINATOR ||
        currentRole === ChurchRole.KID_REGISTER_SUPERVISOR ||
        currentRole === ChurchRole.KID_REGISTER_USER ||
        currentRole === ChurchRole.KID_SECURITY_COORDINATOR ||
        currentRole === ChurchRole.KID_SECURITY_SUPERVISOR ||
        currentRole === ChurchRole.KID_SECURITY_USER
      );
    }
    if (activeVolunteerRole) {
      return (
        activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR ||
        activeVolunteerRole === VolunteerRole.VOLUNTEER
      );
    }
    return (
      !isKidChurchRole &&
      hasRole(
        ChurchRole.KID_REGISTER_COORDINATOR,
        ChurchRole.KID_REGISTER_SUPERVISOR,
        ChurchRole.KID_REGISTER_USER,
        ChurchRole.KID_SECURITY_COORDINATOR,
        ChurchRole.KID_SECURITY_SUPERVISOR,
        ChurchRole.KID_SECURITY_USER,
      )
    );
  }, [currentRole, activeVolunteerRole, isKidChurchRole, hasRole]);

  const canViewTeam =
    !isApoyo &&
    !isServidor &&
    (isSupervisor ||
      hasRole(ChurchRole.MINISTRY_ADMIN) ||
      hasVolunteerRole(
        VolunteerRole.AREA_GENERAL_COORDINATOR,
        VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
      ));

  const canViewCreatorInfo = isAreaCoordinator;
  const canViewRegistrationLog = isSupervisor;

  /**
   * Whether the active role can take volunteer attendance for a service.
   * Coordinadores de área, supervisores, servidores y roles de apoyo no toman asistencia;
   * solo coordinadores de grupo con un equipo asignado o administradores generales toman asistencia.
   */
  const canTakeVolunteerAttendance = useMemo(() => {
    if (isExplicitServidor || isApoyo) return false;
    if (!hasAssignedGroup && !(isSuperAdmin && currentRole === UserRole.SUPER_ADMIN)) {
      return false;
    }

    if (currentRole) {
      if (
        currentRole === ChurchRole.KID_REGISTER_COORDINATOR ||
        currentRole === ChurchRole.MINISTRY_ADMIN ||
        currentRole === ChurchRole.KID_CHURCH_SUPERVISOR ||
        currentRole === ChurchRole.KID_REGISTER_SUPERVISOR ||
        currentRole === ChurchRole.KID_SECURITY_SUPERVISOR ||
        currentRole === ChurchRole.KID_SECURITY_COORDINATOR
      ) {
        return false;
      }
      return (
        currentRole === ChurchRole.KID_CHURCH_GROUP_COORDINATOR ||
        (isSuperAdmin && currentRole === UserRole.SUPER_ADMIN)
      );
    }

    if (activeVolunteerRole) {
      return activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR;
    }

    return (
      hasRole(ChurchRole.KID_CHURCH_GROUP_COORDINATOR) ||
      hasVolunteerRole(VolunteerRole.GROUP_COORDINATOR)
    );
  }, [
    isExplicitServidor,
    isApoyo,
    hasAssignedGroup,
    currentRole,
    isSuperAdmin,
    activeVolunteerRole,
    hasRole,
    hasVolunteerRole,
  ]);

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
    isApoyo,
    hasAssignedGroup,
    isKidChurchRole,
    isKidRegistrationRole,
    canViewTeam,
    canViewCreatorInfo,
    canViewRegistrationLog,
    canTakeVolunteerAttendance,
  };
};
