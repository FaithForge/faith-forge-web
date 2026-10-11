import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { AppRole, ChurchRole, UserRole } from '@/libs/utils/auth';
import { AppCapability, hasCapability } from '@/libs/utils/auth/capabilities';
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

  // Explicit scoped role switches that must NOT inherit broader account-level admin/coordinator privileges:
  const isExplicitServidor =
    currentRole === ChurchRole.KID_REGISTER_USER ||
    currentRole === ChurchRole.KID_CHURCH_USER ||
    currentRole === ChurchRole.KID_SECURITY_USER ||
    activeVolunteerRole === VolunteerRole.VOLUNTEER;

  const isExplicitSupervisor =
    currentRole === ChurchRole.KID_REGISTER_SUPERVISOR ||
    currentRole === ChurchRole.KID_CHURCH_SUPERVISOR ||
    currentRole === ChurchRole.KID_SECURITY_SUPERVISOR ||
    activeVolunteerRole === VolunteerRole.SUPERVISOR;

  const isExplicitGroupCoordinator =
    currentRole === ChurchRole.KID_CHURCH_GROUP_COORDINATOR ||
    activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR;

  const isExplicitScopedRole =
    isExplicitServidor || isExplicitSupervisor || isExplicitGroupCoordinator;

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

  const isAccountSuperAdmin = userRoles.includes(UserRole.SUPER_ADMIN);
  const isAccountAdmin = isAccountSuperAdmin || userRoles.includes(UserRole.ADMIN);

  const isSuperAdmin = activeRoles.has(UserRole.SUPER_ADMIN) || (!isExplicitScopedRole && isAccountSuperAdmin);
  const isAdmin = hasRole(UserRole.SUPER_ADMIN, UserRole.ADMIN) || (!isExplicitScopedRole && isAccountAdmin);
  const isStaff = isAdmin || activeRoles.has(UserRole.STAFF) || (!isExplicitScopedRole && userRoles.includes(UserRole.STAFF));
  const isMinistryAdmin = isAdmin || activeRoles.has(ChurchRole.MINISTRY_ADMIN) || (!isExplicitScopedRole && userRoles.includes(ChurchRole.MINISTRY_ADMIN));

  const isAreaCoordinator =
    !isExplicitScopedRole &&
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
    !isExplicitSupervisor &&
    (isAreaCoordinator ||
      isExplicitGroupCoordinator ||
      hasRole(ChurchRole.KID_CHURCH_GROUP_COORDINATOR) ||
      hasVolunteerRole(VolunteerRole.GROUP_COORDINATOR));

  const isSupervisor =
    !isExplicitServidor &&
    (isGroupCoordinator ||
      isExplicitSupervisor ||
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

  /**
   * Whether the active role can manage church reports / service novedades.
   * Exclusivo para coordinadores de grupo de Kids Church o super administradores generales.
   * No permitido para supervisores, coordinadores de área (ej. Regikids), servidores o apoyo.
   */
  const canManageChurchReports = useMemo(() => {
    if (isExplicitServidor || isApoyo) return false;

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
    currentRole,
    isSuperAdmin,
    activeVolunteerRole,
    hasRole,
    hasVolunteerRole,
  ]);

  /**
   * Helper to check whether the active user satisfies a semantic capability.
   *
   * @param {AppCapability} capability - Semantic action (e.g. 'attendance:take-attendance').
   * @returns {boolean} True if allowed.
   */
  const can = useCallback(
    (capability: AppCapability): boolean => {
      return hasCapability(capability, {
        isAdmin,
        isSuperAdmin,
        isAreaCoordinator,
        isGroupCoordinator,
        isSupervisor,
        isServidor,
        canTakeVolunteerAttendance,
        canManageChurchReports,
        canViewTeam,
        canViewCreatorInfo,
        canViewRegistrationLog,
      });
    },
    [
      isAdmin,
      isSuperAdmin,
      isAreaCoordinator,
      isGroupCoordinator,
      isSupervisor,
      isServidor,
      canTakeVolunteerAttendance,
      canManageChurchReports,
      canViewTeam,
      canViewCreatorInfo,
      canViewRegistrationLog,
    ],
  );

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
    isAccountSuperAdmin,
    isAccountAdmin,
    isStaff,
    isMinistryAdmin,
    isAreaCoordinator,
    isGroupCoordinator,
    isSupervisor,
    isServidor,
    isExplicitSupervisor,
    isExplicitGroupCoordinator,
    isApoyo,
    hasAssignedGroup,
    isKidChurchRole,
    isKidRegistrationRole,
    canViewTeam,
    canViewCreatorInfo,
    canViewRegistrationLog,
    canTakeVolunteerAttendance,
    canManageChurchReports,
    can,
  };
};

