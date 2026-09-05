import { DateTime } from 'luxon';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';

dayjs.extend(utc);

export const MONTH_NUMBER_TO_LETTER: { [key: number]: string } = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

/**
 * Safely formats a calendar date string (YYYY-MM-DD or ISO) without timezone conversion shifts.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @param {string} [formatStr='D [de] MMMM [de] YYYY'] - Target dayjs format.
 * @returns {string} Formatted date string in Spanish locale, or empty string if invalid.
 */
export const formatDateOnly = (
  date?: string | Date | null,
  formatStr: string = 'D [de] MMMM [de] YYYY'
): string => {
  if (!date) return '';
  const dateStr = typeof date === 'string' ? date.substring(0, 10) : dayjs(date).format('YYYY-MM-DD');
  const parsed = dayjs.utc(dateStr);
  if (!parsed.isValid()) return '';
  return parsed.locale('es').format(formatStr);
};

/**
 * Converts a date or ISO string to a safe 'YYYY-MM-DD' string for form inputs and date pickers.
 *
 * @param {string | Date | null | undefined} date - The date to convert.
 * @returns {string} Safe 'YYYY-MM-DD' string.
 */
export const toDateOnlyInputValue = (date?: string | Date | null): string => {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.length >= 10 && date.includes('-')) {
      return date.substring(0, 10);
    }
  }
  const parsed = dayjs.utc(date);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

/**
 * Safely checks if a date (birthday) matches today's month and day (MM-DD) without timezone shifts.
 *
 * @param {string | Date | null | undefined} date - The date to check.
 * @returns {boolean} True if the date matches today's MM-DD.
 */
export const isDateToday = (date?: string | Date | null): boolean => {
  if (!date) return false;
  const dateStr = typeof date === 'string' ? date.substring(0, 10) : dayjs(date).format('YYYY-MM-DD');
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}` === dayjs().format('MM-DD');
  }
  return false;
};

/**
 * Calculates the age in years based on the given birthday.
 * @param {Date} birthday - The date of birth.
 * @returns {number} - The age in years.
 */
export const calculateAge = (birthday: Date): number => {
  const today = DateTime.local();
  const birth = DateTime.fromJSDate(birthday);
  return today.diff(birth, 'years').years;
};

/**
 * Gets the age in months based on the given birthday.
 * @param {Date} birthday - The date of birth.
 * @returns {number} - The age in months.
 */
export const getAgeInMonths = (birthday: Date): number => {
  const today = new Date();
  const yearsDiff = today.getFullYear() - birthday.getFullYear();
  const monthsDiff = today.getMonth() - birthday.getMonth();
  const ageInMonths = yearsDiff * 12 + monthsDiff;
  return ageInMonths;
};

/**
 * Renders a calendar label based on type and numeric data.
 *
 * @param {string} type - The label type (e.g., 'month').
 * @param {number} data - Numeric data used to render the label (e.g., month number).
 * @returns {string} The rendered label.
 */
export const labelRendererCalendar = (type: string, data: number): string => {
  switch (type) {
    case 'month':
      return MONTH_NUMBER_TO_LETTER[data];
    default:
      return data.toString();
  }
};
