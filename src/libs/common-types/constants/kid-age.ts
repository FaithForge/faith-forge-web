import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Minimum age allowed for registering a kid in Iglekids (in months).
 */
export const KID_MIN_AGE_MONTHS = 3;

/**
 * Maximum age allowed for registering a kid in Iglekids (in years).
 * Kids who have reached this age or older cannot be registered (except by admins).
 */
export const KID_MAX_AGE_YEARS = 12;

/**
 * Label descriptions for age boundaries.
 */
export const KID_MIN_AGE_LABEL = `${KID_MIN_AGE_MONTHS} meses`;
export const KID_MAX_AGE_LABEL = `${KID_MAX_AGE_YEARS} años`;
export const KID_MAX_AGE_PLUS_LABEL = `${KID_MAX_AGE_YEARS}+ años`;

/**
 * Dynamic message and copy templates for kid age restrictions.
 */
export const KID_AGE_COPY = {
  minAgeTitle: `Restricción de edad mínima (${KID_MIN_AGE_LABEL})`,
  minAgeValidationError: `El niño debe tener al menos ${KID_MIN_AGE_LABEL} de edad para ser registrado.`,
  minAgeToastError: `No se puede registrar o guardar un niño menor de ${KID_MIN_AGE_LABEL}.`,
  minAgeAlertMessage: (ageDetail?: string) => 
    `Los bebés menores de ${KID_MIN_AGE_LABEL} no pueden ser registrados en el sistema${ageDetail ? ` (${ageDetail})` : ''}.`,
  maxAgeBadge: 'Máxima edad',
  maxAgeSubtitle: `Cumplió la edad máxima (${KID_MAX_AGE_PLUS_LABEL})`,
  maxAgeDashboardSubtitle: 'El niño ya cumplió la edad máxima',
  maxAgeToastError: `El niño ya cumplió la edad máxima (${KID_MAX_AGE_PLUS_LABEL})`,
  maxAgeAlertMessage: `El niño ya cumplió la edad máxima (${KID_MAX_AGE_PLUS_LABEL}). No puede ser registrado en Iglekids.`,
};

/**
 * Checks whether a kid is under the minimum required age (e.g. < 3 months).
 *
 * @param {string | Date | number | null | undefined} val - Birthday ISO string/Date or age in months.
 * @returns {boolean} True if the kid is strictly under the minimum required age.
 */
export const isKidUnderMinAge = (val: string | Date | number | null | undefined): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'number') {
    return val < KID_MIN_AGE_MONTHS;
  }
  const dateStr = typeof val === 'string' ? val.substring(0, 10) : dayjs(val).format('YYYY-MM-DD');
  const birth = dayjs.utc(dateStr);
  if (!birth.isValid()) return false;
  return dayjs().diff(birth, 'month') < KID_MIN_AGE_MONTHS;
};

/**
 * Checks whether a kid has reached or exceeded the maximum age limit (e.g. >= 12 years).
 *
 * @param {Object} kid - Kid object containing age or birthday.
 * @param {number} [kid.age] - Age in years.
 * @param {string | Date} [kid.birthday] - Birthday date.
 * @returns {boolean} True if the kid is overage.
 */
export const isKidOverage = (kid: { age?: number | null; birthday?: string | Date | null } | null | undefined): boolean => {
  if (!kid) return false;
  if (kid.age !== undefined && kid.age !== null) {
    return kid.age >= KID_MAX_AGE_YEARS;
  }
  if (kid.birthday) {
    const dateStr = typeof kid.birthday === 'string' ? kid.birthday.substring(0, 10) : dayjs(kid.birthday).format('YYYY-MM-DD');
    const birth = dayjs.utc(dateStr);
    if (birth.isValid()) {
      return dayjs().diff(birth, 'year') >= KID_MAX_AGE_YEARS;
    }
  }
  return false;
};
