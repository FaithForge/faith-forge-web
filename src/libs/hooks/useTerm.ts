import { useSelector } from 'react-redux';
import { RootState } from '@/libs/state/redux/store';
import {
  ChurchTermKey,
  DEFAULT_CHURCH_TERMINOLOGY,
  DEFAULT_MINISTRY_TERMINOLOGY,
  KidsTermKey,
} from '@/libs/constants/defaultTerminology';
import { MinistryType } from '@/libs/models';

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
 * @returns {string} El término personalizado o el valor predeterminado de escuela infantil.
 */
export function getKidsTerm(
  key: KidsTermKey,
  overrides?: Record<string, string>,
): string {
  return overrides?.[key] || DEFAULT_MINISTRY_TERMINOLOGY.KIDS[key] || key;
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
 * Detecta automáticamente el ministerio de tipo KIDS en Redux y aplica sus personalizaciones.
 *
 * @param {KidsTermKey} key - Clave del término de niños (ej. 'teacher', 'registration', 'guardian', 'classroom').
 * @returns {string} Término del ministerio de niños (ej. 'Maestro(a)' o 'Regikids').
 */
export function useKidsTerm(key: KidsTermKey): string {
  const kidsMinistry = useSelector((state: RootState) =>
    state.ministrySlice.ministries.find(
      (m) =>
        m.type === MinistryType.KIDS ||
        m.name.toLowerCase().includes('niño') ||
        m.name.toLowerCase().includes('kid'),
    ),
  );

  return getKidsTerm(key, kidsMinistry?.terminologyOverrides);
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
