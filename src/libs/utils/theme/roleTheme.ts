import { IVolunteerAssignment, VolunteerRole } from '@/libs/models/Volunteer';
import { MinistryType, MinistryAreaScope } from '@/libs/models/Ministry';

/**
 * Visual styling theme for a volunteer role badge, avatar, and row highlight.
 */
export interface RoleThemeStyle {
  /** Tailwind classes for badge background, text, border, and font weight */
  badge: string;
  /** Tailwind classes for avatar container (background, text, and border) */
  avatar: string;
  /** Tailwind classes for photo focus ring */
  photoRing: string;
  /** Tailwind classes for row background and hover state */
  highlightBg: string;
  /** Tailwind classes for tag or chip component */
  tagBg: string;
  /** Border accent class */
  border?: string;
}

/**
 * Role palette definition for a ministry theme.
 */
export type RoleThemePalette = Record<VolunteerRole, RoleThemeStyle>;

/**
 * Default registration area palette (Emerald / Teal / Jade tones).
 */
export const REGISTRATION_ROLE_THEME: RoleThemePalette = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: {
    badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    avatar: 'bg-amber-100 text-amber-900 border-2 border-amber-300',
    photoRing: 'ring-2 ring-amber-600 ring-offset-1',
    highlightBg: 'bg-amber-50/40 hover:bg-amber-100/50',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: {
    badge: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
    avatar: 'bg-emerald-100 text-emerald-950 border-2 border-emerald-300',
    photoRing: 'ring-2 ring-emerald-700 ring-offset-1',
    highlightBg: 'bg-emerald-50/40 hover:bg-emerald-100/50',
    tagBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
  },
  [VolunteerRole.GROUP_COORDINATOR]: {
    badge: 'bg-pink-100 text-pink-900 border border-pink-300 font-semibold',
    avatar: 'bg-pink-100 text-pink-900 border-2 border-pink-300',
    photoRing: 'ring-2 ring-pink-700 ring-offset-1',
    highlightBg: 'bg-pink-50/40 hover:bg-pink-100/50',
    tagBg: 'bg-pink-100 text-pink-900 border-pink-300',
  },
  [VolunteerRole.SUPERVISOR]: {
    badge: 'bg-teal-100 text-teal-900 border border-teal-300 font-bold',
    avatar: 'bg-teal-100 text-teal-900 border-2 border-teal-600',
    photoRing: 'ring-2 ring-teal-700 ring-offset-1',
    highlightBg: 'bg-teal-50/40 hover:bg-teal-100/50',
    tagBg: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  [VolunteerRole.VOLUNTEER]: {
    badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold',
    avatar: 'bg-emerald-100 text-emerald-900 border-2 border-emerald-600',
    photoRing: 'ring-2 ring-emerald-600 ring-offset-1',
    highlightBg: 'bg-emerald-50/30 hover:bg-emerald-100/40',
    tagBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
};

/**
 * Default kids church palette (Purple / Amber / Pink tones).
 */
export const KIDS_CHURCH_ROLE_THEME: RoleThemePalette = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: {
    badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    avatar: 'bg-amber-100 text-amber-900 border-2 border-amber-300',
    photoRing: 'ring-2 ring-amber-600 ring-offset-1',
    highlightBg: 'bg-amber-50/40 hover:bg-amber-100/50',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: {
    badge: 'bg-blue-100 text-blue-900 border border-blue-200 font-semibold',
    avatar: 'bg-blue-100 text-blue-900 border-2 border-blue-200',
    photoRing: 'ring-2 ring-blue-500 ring-offset-1',
    highlightBg: 'bg-blue-50/30 hover:bg-blue-100/40',
    tagBg: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  [VolunteerRole.GROUP_COORDINATOR]: {
    badge: 'bg-pink-100 text-pink-900 border border-pink-200 font-semibold',
    avatar: 'bg-pink-100 text-pink-900 border-2 border-pink-200',
    photoRing: 'ring-2 ring-pink-700 ring-offset-1',
    highlightBg: 'bg-pink-50/40 hover:bg-pink-100/50',
    tagBg: 'bg-pink-100 text-pink-900 border-pink-200',
  },
  [VolunteerRole.SUPERVISOR]: {
    badge: 'bg-purple-100 text-purple-900 border border-purple-200 font-bold',
    avatar: 'bg-purple-100 text-purple-900 border-2 border-purple-600',
    photoRing: 'ring-2 ring-purple-600 ring-offset-1',
    highlightBg: 'bg-purple-50/40 hover:bg-purple-100/50',
    tagBg: 'bg-purple-100 text-purple-900 border-purple-200',
  },
  [VolunteerRole.VOLUNTEER]: {
    badge: 'bg-amber-100 text-amber-900 border border-amber-200 font-semibold',
    avatar: 'bg-amber-100 text-amber-900 border-2 border-amber-500',
    photoRing: 'ring-2 ring-amber-500 ring-offset-1',
    highlightBg: 'bg-amber-50/30 hover:bg-amber-100/40',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-200',
  },
};

/**
 * Universal default palette for general ministries (Worship, Ushers, Youth, Media, etc.).
 */
export const GENERAL_ROLE_THEME: RoleThemePalette = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: {
    badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    avatar: 'bg-amber-100 text-amber-900 border-2 border-amber-300',
    photoRing: 'ring-2 ring-amber-600 ring-offset-1',
    highlightBg: 'bg-amber-50/40 hover:bg-amber-100/50',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: {
    badge: 'bg-blue-100 text-blue-900 border border-blue-200 font-semibold',
    avatar: 'bg-blue-100 text-blue-900 border-2 border-blue-200',
    photoRing: 'ring-2 ring-blue-500 ring-offset-1',
    highlightBg: 'bg-blue-50/30 hover:bg-blue-100/40',
    tagBg: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  [VolunteerRole.GROUP_COORDINATOR]: {
    badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold',
    avatar: 'bg-indigo-100 text-indigo-900 border-2 border-indigo-200',
    photoRing: 'ring-2 ring-indigo-600 ring-offset-1',
    highlightBg: 'bg-indigo-50/40 hover:bg-indigo-100/50',
    tagBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  },
  [VolunteerRole.SUPERVISOR]: {
    badge: 'bg-violet-100 text-violet-900 border border-violet-200 font-bold',
    avatar: 'bg-violet-100 text-violet-900 border-2 border-violet-600',
    photoRing: 'ring-2 ring-violet-600 ring-offset-1',
    highlightBg: 'bg-violet-50/40 hover:bg-violet-100/50',
    tagBg: 'bg-violet-100 text-violet-900 border-violet-200',
  },
  [VolunteerRole.VOLUNTEER]: {
    badge: 'bg-slate-100 text-slate-900 border border-slate-200 font-semibold',
    avatar: 'bg-slate-100 text-slate-900 border-2 border-slate-400',
    photoRing: 'ring-2 ring-slate-500 ring-offset-1',
    highlightBg: 'bg-slate-50/60 hover:bg-slate-100/70',
    tagBg: 'bg-slate-100 text-slate-900 border-slate-200',
  },
};

/**
 * Options to resolve a volunteer role visual theme.
 */
export interface GetVolunteerRoleThemeOptions {
  /** Explicit ministry type if known */
  ministryType?: MinistryType;
  /** Area scope enum */
  areaScope?: MinistryAreaScope | null;
  /** Future custom theme overrides per role defined by church admins */
  themeOverrides?: Partial<Record<VolunteerRole, Partial<RoleThemeStyle>>>;
}

/**
 * Resolves the visual theme style for a volunteer assignment or role.
 *
 * @param {VolunteerRole} role - The volunteer operational role.
 * @param {GetVolunteerRoleThemeOptions} [options] - Resolution options (ministry type, overrides).
 * @returns {RoleThemeStyle} The styling tokens for badge, avatar, ring, and highlight.
 */
export function getVolunteerRoleTheme(
  role: VolunteerRole,
  options?: GetVolunteerRoleThemeOptions,
): RoleThemeStyle {
  const isRegistrationArea = options?.areaScope === MinistryAreaScope.KID_REGISTRATION;

  // 1. Base palette selection
  let basePalette = GENERAL_ROLE_THEME;
  if (isRegistrationArea) {
    basePalette = REGISTRATION_ROLE_THEME;
  } else if (options?.ministryType === MinistryType.KIDS || !options?.ministryType) {
    basePalette = KIDS_CHURCH_ROLE_THEME;
  }

  const baseStyle = basePalette[role] || GENERAL_ROLE_THEME[VolunteerRole.VOLUNTEER];

  // 2. Future admin overrides support (zero modification needed in consumers when activated)
  const roleOverride = options?.themeOverrides?.[role];
  if (!roleOverride) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    ...roleOverride,
  };
}

/**
 * Resolves the visual theme directly from a volunteer assignment record.
 *
 * @param {IVolunteerAssignment} asg - The volunteer assignment object.
 * @param {Partial<Record<VolunteerRole, Partial<RoleThemeStyle>>>} [customOverrides] - Optional overrides.
 * @returns {RoleThemeStyle} The resolved theme styles.
 */
export function getAssignmentRoleTheme(
  asg: IVolunteerAssignment,
  customOverrides?: Partial<Record<VolunteerRole, Partial<RoleThemeStyle>>>,
): RoleThemeStyle {
  const asgArea = asg.ministryArea || asg.serviceAreaGroup?.ministryArea;
  const areaScope = asgArea?.scope ?? null;
  const ministryType = asg.ministry?.type;

  return getVolunteerRoleTheme(asg.role, {
    ministryType,
    areaScope,
    themeOverrides: customOverrides,
  });
}
