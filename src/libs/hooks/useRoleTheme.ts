import { IVolunteerAssignment, VolunteerRole } from '@/libs/models/Volunteer';
import {
  getAssignmentRoleTheme,
  getVolunteerRoleTheme,
  GetVolunteerRoleThemeOptions,
  RoleThemeStyle,
} from '@/libs/utils/theme/roleTheme';
import { useMemo } from 'react';

/**
 * React hook to resolve consistent, ministry-adaptive styling tokens for volunteer roles.
 *
 * @param {VolunteerRole | IVolunteerAssignment} roleOrAssignment - The role enum or volunteer assignment object.
 * @param {GetVolunteerRoleThemeOptions} [options] - Optional context options for theme resolution.
 * @returns {RoleThemeStyle} The reactive theme tokens (badge, avatar, photoRing, highlightBg, tagBg).
 */
export function useRoleTheme(
  roleOrAssignment: VolunteerRole | IVolunteerAssignment,
  options?: GetVolunteerRoleThemeOptions,
): RoleThemeStyle {
  return useMemo(() => {
    if (typeof roleOrAssignment === 'string') {
      return getVolunteerRoleTheme(roleOrAssignment as VolunteerRole, options);
    }
    return getAssignmentRoleTheme(roleOrAssignment, options?.themeOverrides);
  }, [roleOrAssignment, options]);
}

export { getAssignmentRoleTheme, getVolunteerRoleTheme };
export type { GetVolunteerRoleThemeOptions, RoleThemeStyle };
