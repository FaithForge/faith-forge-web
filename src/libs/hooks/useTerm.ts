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
 * Resuelve un término institucional de nivel Iglesia con soporte de personalización por tenant.
 *
 * @param {ChurchTermKey} key - Clave del término institucional (ej. 'meeting', 'campus', 'volunteer').
 * @param {Record<string, string>} [overrides] - Overrides directos opcionales (para contextos no reactivos).
 * @returns {string} El término personalizado o el valor universal predeterminado.
 */
export function getChurchTerm(
  key: ChurchTermKey,
  overrides?: Record<string, string>,
): string {
  return overrides?.[key] || DEFAULT_CHURCH_TERMINOLOGY[key] || key;
}

/**
 * Resuelve un término operativo de nivel Ministerio Infantil con soporte de personalización por ministerio.
 *
 * @param {KidsTermKey} key - Clave del término de niños (ej. 'teacher', 'registration', 'guardian').
 * @param {Record<string, string>} [overrides] - Overrides directos del ministerio.
 * @param {string} [ministryName] - Nombre del ministerio como fallback de module_alias.
 * @returns {string} El término personalizado o el valor predeterminado de escuela infantil.
 */
export function getKidsTerm(
  key: KidsTermKey,
  overrides?: Record<string, string>,
  ministryName?: string,
): string {
  if (overrides?.[key]) {
    return overrides[key];
  }
  // Si no hay override específico de module_alias pero el ministerio tiene nombre configurado en BD, usarlo
  if (key === 'module_alias' && ministryName?.trim()) {
    return ministryName.trim();
  }
  return DEFAULT_MINISTRY_TERMINOLOGY.KIDS[key] || key;
}

/**
 * Hook reactivo para obtener términos institucionales de nivel Iglesia.
 * Reactivo a cambios en la configuración de la iglesia activa en Redux.
 *
 * @param {ChurchTermKey} key - Clave del término de la iglesia (ej. 'meeting', 'campus', 'volunteer').
 * @returns {string} Término institucional configurado por la iglesia o default universal.
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
 * Hook reactivo para obtener términos del Ministerio de Niños.
 * Detecta automáticamente el ministerio de tipo KIDS de la sede activa en Redux y aplica sus personalizaciones.
 * Incluye resolución contextual por sede, fallback al nombre del ministerio y fallback inteligente a áreas de registro.
 *
 * @param {KidsTermKey} key - Clave del término de niños (ej. 'teacher', 'registration', 'guardian', 'classroom').
 * @returns {string} Término del ministerio de niños (ej. 'Iglekids', 'Regikids', 'Servidor(a)').
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

    // 1. Priorizar el ministerio KIDS de la sede activa
    if (activeCampusId) {
      const campusMatch = ministries.find(
        (m) => m.churchCampusId === activeCampusId && m.type === MinistryType.KIDS,
      );
      if (campusMatch) return campusMatch;
    }

    // 2. Fallback a cualquier ministerio KIDS cargado
    return ministries.find((m) => m.type === MinistryType.KIDS);
  });

  // 3. Fallback de nombre de ministerio si Redux aún no ha hidratado ministries
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

  // 4. Fallback de 'registration' si hay un área con scope KID_REGISTRATION en el contexto del campus
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
 * Hook reactivo general para resolver términos de un ministerio específico por ID o tipo.
 *
 * @param {string | undefined} ministryId - ID del ministerio a consultar.
 * @param {string} key - Clave del término a consultar.
 * @param {string} [fallback] - Texto alternativo en caso de no encontrarse.
 * @returns {string} Término resuelto.
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
 * Opciones para resolver la etiqueta de un rol de voluntario.
 */
export interface VolunteerRoleLabelOptions {
  ministryType?: MinistryType;
  ministryOverrides?: Record<string, string>;
  churchOverrides?: Record<string, string>;
  short?: boolean;
  plural?: boolean;
}

/**
 * Resuelve la etiqueta de un rol de servicio según el contexto del ministerio y la iglesia.
 * Por ejemplo:
 * - En un ministerio de niños (KIDS), el rol base VOLUNTEER se resuelve al término configurado (por defecto 'Servidor(a)' o personalizable a 'Maestro(a)').
 * - En un ministerio general, se resuelve a 'Servidor' (o el término institucional configurado).
 *
 * @param {VolunteerRole} role - Rol operativo del voluntario.
 * @param {VolunteerRoleLabelOptions} [options] - Opciones de contexto (tipo de ministerio, overrides, abreviación, plural).
 * @returns {string} Etiqueta contextualizada del rol.
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
 * Hook reactivo para obtener la etiqueta de un VolunteerRole contextualizado a un ministerio.
 *
 * @param {VolunteerRole} role - Rol operativo.
 * @param {string | undefined} [ministryId] - ID del ministerio para inferir tipo y overrides.
 * @param {Omit<VolunteerRoleLabelOptions, 'ministryType' | 'ministryOverrides' | 'churchOverrides'>} [options] - Opciones de formato.
 * @returns {string} Etiqueta contextualizada reactiva.
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

