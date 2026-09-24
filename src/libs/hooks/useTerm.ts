import { useSelector } from 'react-redux';
import { RootState } from '@/libs/state/redux/store';
import {
  ChurchTermKey,
  DEFAULT_CHURCH_TERMINOLOGY,
  DEFAULT_MINISTRY_TERMINOLOGY,
  KidsTermKey,
} from '@/libs/constants/defaultTerminology';
import { MinistryType, VolunteerRole } from '@/libs/models';

/**
 * Resolves an institutional Church-level terminology term with tenant customization support.
 *
 * @param {ChurchTermKey} key - The institutional term key (e.g., 'meeting', 'campus', 'volunteer').
 * @param {Record<string, string>} [overrides] - Optional direct term overrides (for non-reactive contexts).
 * @returns {string} The customized term or the universal default fallback.
 */
export function getChurchTerm(
  key: ChurchTermKey,
  overrides?: Record<string, string>,
): string {
  return overrides?.[key] || DEFAULT_CHURCH_TERMINOLOGY[key] || key;
}

/**
 * Resolves an operational Kids Ministry-level term with per-ministry customization support.
 *
 * @param {KidsTermKey} key - Kids term key (e.g., 'teacher', 'registration', 'guardian').
 * @param {Record<string, string>} [overrides] - Direct ministry terminology overrides.
 * @param {string} [ministryName] - Ministry name used as fallback for module_alias.
 * @returns {string} The customized term or the default kid church fallback.
 */
export function getKidsTerm(
  key: KidsTermKey,
  overrides?: Record<string, string>,
  ministryName?: string,
): string {
  if (overrides?.[key]) {
    return overrides[key];
  }
  // If there is no specific module_alias override but the ministry has a configured name, use it
  if (key === 'module_alias' && ministryName?.trim()) {
    return ministryName.trim();
  }
  return DEFAULT_MINISTRY_TERMINOLOGY.KIDS[key] || key;
}

/**
 * Reactive hook to obtain Church-level institutional terms.
 * Subscribes to changes in the active church configuration within Redux.
 *
 * @param {ChurchTermKey} key - Church term key (e.g., 'meeting', 'campus', 'volunteer').
 * @returns {string} Church-configured institutional term or universal default.
 */
export function useChurchTerm(key: ChurchTermKey): string {
  const overrides = useSelector(
    (state: RootState) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides,
  );
  return getChurchTerm(key, overrides);
}

/**
 * Reactive hook to obtain Kids Ministry terminology.
 * Automatically detects the KIDS ministry for the active campus in Redux and applies customizations.
 * Includes contextual campus resolution, ministry name fallback, and intelligent registration area fallback.
 *
 * @param {KidsTermKey} key - Kids term key (e.g., 'teacher', 'registration', 'guardian', 'classroom').
 * @returns {string} Resolved kids ministry term (e.g., 'Iglekids', 'Regikids', 'Servidor(a)').
 */
export function useKidsTerm(key: KidsTermKey): string {
  const activeCampusId = useSelector(
    (state: RootState) =>
      state.churchCampusSlice.current?.id ||
      state.volunteerContextSlice.activeCampusId,
  );

  const volunteerCampuses = useSelector(
    (state: RootState) => state.volunteerContextSlice.campuses || [],
  );

  const kidsMinistry = useSelector((state: RootState) => {
    const ministries = state.ministrySlice.ministries || [];

    // 1. Prioritize KIDS ministry for the active campus
    if (activeCampusId) {
      const campusMatch = ministries.find(
        (m) => m.churchCampusId === activeCampusId && m.type === MinistryType.KIDS,
      );
      if (campusMatch) return campusMatch;
    }

    // 2. Fallback to any loaded KIDS ministry
    return ministries.find((m) => m.type === MinistryType.KIDS);
  });

  // 3. Ministry name fallback if Redux has not yet hydrated ministries array
  const fallbackMinistryName = useSelector((state: RootState) => {
    if (kidsMinistry?.name) return kidsMinistry.name;
    const currentVolunteerCampus =
      volunteerCampuses.find((c) => c.id === activeCampusId) ||
      volunteerCampuses[0];
    if (currentVolunteerCampus?.ministryCoordinator?.ministryName) {
      return currentVolunteerCampus.ministryCoordinator.ministryName;
    }
    return undefined;
  });

  // 4. Fallback for 'registration' if an area with KID_REGISTRATION scope exists in campus context
  const registrationAreaFallback = useSelector((state: RootState) => {
    if (key !== 'registration') return undefined;
    const currentVolunteerCampus =
      volunteerCampuses.find((c) => c.id === activeCampusId) ||
      volunteerCampuses[0];
    if (currentVolunteerCampus) {
      for (const group of currentVolunteerCampus.groups || []) {
        const regArea = group.areas?.find(
          (a) => a.scope === 'KID_REGISTRATION',
        );
        if (regArea?.name) return regArea.name;
      }
      const coordArea = currentVolunteerCampus.areaCoordinates?.find(
        (a) => a.scope === 'KID_REGISTRATION',
      );
      if (coordArea?.name) return coordArea.name;
    }
    return undefined;
  });

  const resolved = getKidsTerm(key, kidsMinistry?.terminologyOverrides, fallbackMinistryName);
  if (key === 'registration' && resolved === DEFAULT_MINISTRY_TERMINOLOGY.KIDS.registration && registrationAreaFallback) {
    return registrationAreaFallback;
  }
  return resolved;
}

/**
 * General reactive hook to resolve terminology for a specific ministry by ID or type.
 *
 * @param {string | undefined} ministryId - ID of the ministry to query.
 * @param {string} key - Terminology key to look up.
 * @param {string} [fallback] - Alternative fallback text if not found.
 * @returns {string} The resolved term.
 */
export function useMinistryTerm(
  ministryId: string | undefined,
  key: string,
  fallback?: string,
): string {
  const ministry = useSelector((state: RootState) =>
    ministryId
      ? state.ministrySlice.ministries.find((m) => m.id === ministryId)
      : undefined,
  );

  if (ministry?.terminologyOverrides?.[key]) {
    return ministry.terminologyOverrides[key];
  }

  if (ministry?.type === MinistryType.KIDS) {
    const kidsKey = key as KidsTermKey;
    if (kidsKey in DEFAULT_MINISTRY_TERMINOLOGY.KIDS) {
      return DEFAULT_MINISTRY_TERMINOLOGY.KIDS[kidsKey];
    }
  }

  return fallback || key;
}

/**
 * Configuration options for resolving volunteer role labels.
 */
export interface VolunteerRoleLabelOptions {
  ministryType?: MinistryType;
  ministryOverrides?: Record<string, string>;
  churchOverrides?: Record<string, string>;
  short?: boolean;
  plural?: boolean;
}

/**
 * Resolves the display label for a service role contextualized by ministry and church.
 * For example:
 * - In a KIDS ministry, the base role VOLUNTEER resolves to the configured kids term ('Servidor(a)' or 'Maestro(a)').
 * - In a general ministry, it resolves to 'Servidor' (or the church configured institutional term).
 *
 * @param {VolunteerRole} role - Operational volunteer role enum.
 * @param {VolunteerRoleLabelOptions} [options] - Contextual options (ministry type, overrides, short form, plural).
 * @returns {string} Contextualized role display label.
 */
export function getVolunteerRoleLabel(
  role: VolunteerRole,
  options?: VolunteerRoleLabelOptions,
): string {
  const isKids = options?.ministryType === MinistryType.KIDS;
  const isShort = options?.short ?? false;
  const isPlural = options?.plural ?? false;

  switch (role) {
    case VolunteerRole.MINISTRY_GENERAL_COORDINATOR:
      return isShort
        ? isPlural
          ? 'Coords. Generales'
          : 'Coord. General'
        : isPlural
          ? 'Coordinadores Generales del Ministerio'
          : 'Coordinador General del Ministerio';

    case VolunteerRole.AREA_GENERAL_COORDINATOR:
      return isShort
        ? isPlural
          ? 'Coords. Área'
          : 'Coord. Área'
        : isPlural
          ? 'Coordinadores Generales de Área'
          : 'Coordinador General de Área';

    case VolunteerRole.GROUP_COORDINATOR: {
      const customCoord = isPlural
        ? (options?.ministryOverrides?.['coordinators'] || options?.churchOverrides?.['coordinators'])
        : (options?.ministryOverrides?.['coordinator'] || options?.churchOverrides?.['coordinator']);
      if (customCoord) {
        return isShort ? customCoord : (isPlural ? `${customCoord} de Grupo` : `${customCoord} de Grupo`);
      }
      return isShort
        ? isPlural
          ? 'Coords. Grupo'
          : 'Coord. Grupo'
        : isPlural
          ? 'Coordinadores de Grupo'
          : 'Coordinador de Grupo';
    }

    case VolunteerRole.SUPERVISOR: {
      const customSup = isPlural
        ? (options?.ministryOverrides?.['supervisors'] || options?.churchOverrides?.['supervisors'])
        : (options?.ministryOverrides?.['supervisor'] || options?.churchOverrides?.['supervisor']);
      if (customSup) {
        return isShort ? customSup : (isPlural ? `${customSup} de Equipo` : `${customSup} de Equipo`);
      }
      return isShort
        ? isPlural
          ? 'Supervisores'
          : 'Supervisor'
        : isPlural
          ? 'Supervisores de Equipo'
          : 'Supervisor de Equipo';
    }

    case VolunteerRole.VOLUNTEER:
    default:
      if (isKids) {
        return getKidsTerm(
          isPlural ? 'teachers' : 'teacher',
          options?.ministryOverrides,
        );
      }
      if (options?.ministryOverrides?.['volunteer']) {
        return options.ministryOverrides['volunteer'];
      }
      return getChurchTerm(
        isPlural ? 'volunteers' : 'volunteer',
        options?.churchOverrides,
      );
  }
}

/**
 * Reactive hook to obtain the display label of a VolunteerRole contextualized to a ministry.
 *
 * @param {VolunteerRole} role - Operational volunteer role.
 * @param {string | undefined} [ministryId] - Ministry ID used to infer type and overrides.
 * @param {Omit<VolunteerRoleLabelOptions, 'ministryType' | 'ministryOverrides' | 'churchOverrides'>} [options] - Formatting options.
 * @returns {string} Reactive contextualized role label.
 */
export function useVolunteerRoleLabel(
  role: VolunteerRole,
  ministryId?: string,
  options?: Omit<VolunteerRoleLabelOptions, 'ministryType' | 'ministryOverrides' | 'churchOverrides'>,
): string {
  const churchOverrides = useSelector(
    (state: RootState) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides,
  );
  const ministry = useSelector((state: RootState) =>
    ministryId
      ? state.ministrySlice.ministries.find((m) => m.id === ministryId)
      : undefined,
  );

  return getVolunteerRoleLabel(role, {
    ...options,
    ministryType: ministry?.type,
    ministryOverrides: ministry?.terminologyOverrides,
    churchOverrides,
  });
}
