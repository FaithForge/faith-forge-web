import { AppRole, UserRole, ChurchRole } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import {
  IKidRegistration,
  KidAttendanceStatusEnum,
} from '@/libs/models/KidChurch';
import {
  IVolunteerCampusContext,
  IVolunteerGroupConfigContext,
  VolunteerRole,
} from '@/libs/models/Volunteer';

export type RegistrationLogBadgeType =
  | 'group'
  | 'support'
  | 'admin'
  | 'coordinator'
  | 'legacy'
  | 'general';

export interface IParsedRegistrationLog {
  author: string;
  badgeLabel?: string;
  badgeType: RegistrationLogBadgeType;
  rawText: string;
}

interface BuildRegistrationLogParams {
  user?: { firstName?: string; lastName?: string } | null;
  volunteerContext?: {
    activeGroupConfigId?: string | null;
    activeGroupConfigName?: string | null;
    hasActiveGrants?: boolean;
    activeCampusId?: string | null;
    campuses?: IVolunteerCampusContext[];
  } | null;
  currentRole?: AppRole | string | null;
  campusId?: string | null;
}

/**
 * Checks if an area is registration-scoped.
 *
 * @param {any} area - The area object to inspect.
 * @returns {boolean} True if area relates to kid registration.
 */
const isRegistrationArea = (area: any): boolean => {
  if (!area) return false;
  return (area.scope || '').toString().toUpperCase() === 'KID_REGISTRATION';
};

/**
 * Finds if a user has an assigned group in the given groups list for the given role.
 *
 * @param {string | null | undefined} roleId - Current user role.
 * @param {IVolunteerGroupConfigContext[]} groups - Campus volunteer groups.
 * @returns {IVolunteerGroupConfigContext | null} Matching assigned group or null.
 */
export const findAssignedGroup = (
  roleId?: string | null,
  groups?: IVolunteerGroupConfigContext[],
): IVolunteerGroupConfigContext | null => {
  if (!groups || groups.length === 0) return null;

  const matches = groups.filter((group) => {
    if (roleId === UserRole.KID_GROUP_ADMIN) {
      if (group.groupRole === VolunteerRole.GROUP_COORDINATOR) return true;
      return group.areas?.some(
        (a) => !isRegistrationArea(a) && a.role === VolunteerRole.GROUP_COORDINATOR,
      );
    }
    if (roleId === UserRole.KID_GROUP_SUPERVISOR) {
      if (group.groupRole === VolunteerRole.SUPERVISOR) return true;
      return group.areas?.some(
        (a) => !isRegistrationArea(a) && a.role === VolunteerRole.SUPERVISOR,
      );
    }
    if (roleId === UserRole.KID_GROUP_USER) {
      return group.areas?.some(
        (a) => !isRegistrationArea(a) && a.role === VolunteerRole.VOLUNTEER,
      );
    }
    if (roleId === UserRole.KID_REGISTER_SUPERVISOR) {
      return group.areas?.some(
        (a) => isRegistrationArea(a) && a.role === VolunteerRole.SUPERVISOR,
      );
    }
    if (roleId === UserRole.KID_REGISTER_USER) {
      return group.areas?.some(
        (a) => isRegistrationArea(a) && a.role === VolunteerRole.VOLUNTEER,
      );
    }
    return false;
  });

  return matches.length > 0 ? matches[0] : null;
};

/**
 * Builds the canonical registration log string based on the user's active group
 * or their role/support status (temporary permissions, coordinator, admin).
 *
 * @param {BuildRegistrationLogParams} params - Context and identity parameters.
 * @returns {string} Formatted log entry.
 */
export const buildRegistrationLog = ({
  user,
  volunteerContext,
  currentRole,
  campusId,
}: BuildRegistrationLogParams): string => {
  const firstName = user?.firstName?.trim() || '';
  const lastName = user?.lastName?.trim() || '';
  const fullName = capitalizeWords(`${firstName} ${lastName}`.trim()) || 'Servidor';

  // 1. Resolve assigned group name
  let assignedGroupName: string | null = null;
  const activeGroupId = volunteerContext?.activeGroupConfigId;
  const activeGroupName = volunteerContext?.activeGroupConfigName?.trim();

  const isDummyAdminGroup =
    activeGroupId === 'ADMIN_GROUP' ||
    activeGroupName?.toLowerCase() === 'grupo admin';

  if (activeGroupName && !isDummyAdminGroup) {
    assignedGroupName = activeGroupName;
  } else {
    // Fallback: check if the user has an assigned group in the campus
    const targetCampusId = campusId || volunteerContext?.activeCampusId;
    const currentCampus =
      volunteerContext?.campuses?.find((c) => c.id === targetCampusId) ||
      volunteerContext?.campuses?.[0];

    if (currentCampus?.groups?.length) {
      const match = findAssignedGroup(currentRole, currentCampus.groups);
      if (match) {
        assignedGroupName = match.name.trim();
      }
    }
  }

  // 2. Format with assigned group if present
  if (assignedGroupName) {
    const formattedGroup = assignedGroupName.toLowerCase().startsWith('grupo')
      ? assignedGroupName
      : `Grupo ${assignedGroupName}`;
    return `Registrado por ${fullName} del ${formattedGroup}`;
  }

  // 3. No assigned group: classify by role / support status
  const isSuperAdmin = currentRole === UserRole.SUPER_ADMIN;
  const isAdmin = currentRole === UserRole.ADMIN || currentRole === UserRole.STAFF;
  const isAreaCoord =
    currentRole === UserRole.KID_REGISTER_ADMIN ||
    currentRole === ChurchRole.MINISTRY_ADMIN;

  if (isSuperAdmin || isAdmin) {
    return `Registrado por ${fullName} (Administrador)`;
  }

  if (isAreaCoord) {
    return `Registrado por ${fullName} (Coordinación)`;
  }

  // Volunteers with temporary permissions or ad-hoc support without a group
  return `Registrado por ${fullName} (Apoyo)`;
};

/**
 * Parses a registration log string to extract the author, badge label, and visual type.
 *
 * @param {string | null | undefined} log - The raw registration log string.
 * @returns {IParsedRegistrationLog | null} Parsed data or null if empty.
 */
export const parseRegistrationLog = (
  log?: string | null,
): IParsedRegistrationLog | null => {
  if (!log || !log.trim()) return null;

  const text = log.trim();

  // Pattern: "Registrado por [Nombre] del [Grupo]"
  const groupMatch = text.match(
    /^registrado\s+por\s+(.*?)\s+del\s+(grupo\s+.*|.*)$/i,
  );
  if (groupMatch) {
    const author = capitalizeWords(groupMatch[1].trim());
    const rawGroup = groupMatch[2].trim();

    // Check for legacy "Grupo X"
    if (rawGroup.toLowerCase() === 'grupo x') {
      return {
        author,
        badgeLabel: 'Sin grupo',
        badgeType: 'legacy',
        rawText: text,
      };
    }

    return {
      author,
      badgeLabel: rawGroup,
      badgeType: 'group',
      rawText: text,
    };
  }

  // Pattern: "Registrado por [Nombre] (Apoyo|Apoyo temporal|Administrador|Coordinación)"
  const roleOrSupportMatch = text.match(
    /^registrado\s+por\s+(.*?)\s*\((.*?)\)$/i,
  );
  if (roleOrSupportMatch) {
    const author = capitalizeWords(roleOrSupportMatch[1].trim());
    const tag = roleOrSupportMatch[2].trim();
    const tagLower = tag.toLowerCase();

    let badgeType: RegistrationLogBadgeType = 'support';
    let badgeLabel = tag;

    if (tagLower.includes('admin')) {
      badgeType = 'admin';
      badgeLabel = 'Administrador';
    } else if (tagLower.includes('coord')) {
      badgeType = 'coordinator';
      badgeLabel = 'Coordinación';
    } else if (tagLower.includes('apoyo')) {
      badgeType = 'support';
      badgeLabel = 'Apoyo';
    }

    return {
      author,
      badgeLabel,
      badgeType,
      rawText: text,
    };
  }

  // Generic pattern: "Registrado por [Nombre]"
  const genericMatch = text.match(/^registrado\s+por\s+(.*)$/i);
  if (genericMatch) {
    return {
      author: capitalizeWords(genericMatch[1].trim()),
      badgeType: 'general',
      rawText: text,
    };
  }

  return {
    author: capitalizeWords(text),
    badgeType: 'general',
    rawText: text,
  };
};

/**
 * Resolves volunteer author and badge information for a kid registration.
 * Works both with structured fields (additionalInfo / attendanceStages) and historical log strings.
 *
 * @param {IKidRegistration | null | undefined} registration - The registration to extract author info from.
 * @returns {IParsedRegistrationLog | null} Parsed registration author information.
 */
export const getRegistrationLogInfo = (
  registration?: IKidRegistration | null,
): IParsedRegistrationLog | null => {
  if (!registration) return null;

  const registerFullName = registration.additionalInfo?.registerFullName;
  const registerGroupName = registration.additionalInfo?.registerGroupName;

  if (registerFullName) {
    const author = capitalizeWords(registerFullName.trim());
    const group = registerGroupName?.trim();

    if (!group) {
      return {
        author,
        badgeType: 'general',
        rawText: `Registrado por ${author}`,
      };
    }

    const groupLower = group.toLowerCase();

    if (groupLower.includes('coord')) {
      const badgeLabel = groupLower.includes('general') ? 'Coordinación General' : 'Coordinación';
      return {
        author,
        badgeLabel,
        badgeType: 'coordinator',
        rawText: `Registrado por ${author} (${badgeLabel})`,
      };
    }

    if (groupLower.includes('admin')) {
      return {
        author,
        badgeLabel: 'Administrador',
        badgeType: 'admin',
        rawText: `Registrado por ${author} (Administrador)`,
      };
    }

    if (groupLower.includes('apoyo')) {
      return {
        author,
        badgeLabel: 'Apoyo',
        badgeType: 'support',
        rawText: `Registrado por ${author} (Apoyo)`,
      };
    }

    const formattedGroup = groupLower.startsWith('grupo') ? group : `Grupo ${group}`;
    return {
      author,
      badgeLabel: formattedGroup,
      badgeType: 'group',
      rawText: `Registrado por ${author} del ${formattedGroup}`,
    };
  }

  // Fallback for historical raw log strings if present on legacy records
  const legacyLog =
    (registration as any).log ||
    (registration.attendanceStages?.[KidAttendanceStatusEnum.CHECKED_IN] as any)?.volunteerName;

  if (legacyLog) {
    const parsed = parseRegistrationLog(legacyLog);
    if (parsed) return parsed;

    return {
      author: capitalizeWords(legacyLog),
      badgeLabel: registerGroupName || undefined,
      badgeType: registerGroupName ? 'group' : 'general',
      rawText: `Registrado por ${legacyLog}`,
    };
  }

  return null;
};

