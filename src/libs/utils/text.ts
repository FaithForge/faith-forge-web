import { formatPhoneDisplay } from './phone';

/**
 * Capitalizes the first letter of every word in the given string, formatting it to Title Case.
 * Handles accented characters, hyphens, parentheses, and normalizes consecutive spaces.
 * E.g.: "JUAN CARLOS PEÑA MERLANO" -> "Juan Carlos Peña Merlano".
 *
 * @param {string} [input] - The input string to capitalize.
 * @returns {string} The capitalized string, or an empty string if input is falsy.
 */
export const capitalizeWords = (input?: string): string => {
  if (!input) return '';

  const trimmed = input.trim();
  if (trimmed.length === 0) return '';

  return trimmed
    .toLowerCase()
    .replace(/(?:^|[\s\-(/])\p{L}/gu, (m) => m.toUpperCase())
    .replace(/\s+/g, ' ');
};

/**
 * Formats a person's full name into Title Case (e.g., "Juan Carlos Peña Merlano").
 * Can be called with (firstName, lastName) or a single full name string.
 *
 * @param {string} [firstName] - The first name(s) or full name string.
 * @param {string} [lastName] - The last name(s).
 * @returns {string} Formatted full name in Title Case, or an empty string if input is empty.
 */
export const formatPersonFullName = (firstName?: string, lastName?: string): string => {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  if (parts.length === 0) return '';
  return capitalizeWords(parts.join(' '));
};

/**
 * Removes accents from accented vowels in a text, removes non-letter characters,
 * and performs additional formatting by removing leading and trailing spaces
 * and replacing multiple spaces with a single space.
 *
 * @param {string} text - The input text with accents and non-letter characters.
 * @returns {string} The text without accents, non-letter characters, and formatted.
 */

export const removeAccentsAndFormat = (text: string): string => {
  // Mapping of accented characters to their unaccented equivalents
  const accentMap: { [key: string]: string } = {
    á: 'a',
    é: 'e',
    í: 'i',
    ó: 'o',
    ú: 'u',
    Á: 'A',
    É: 'E',
    Í: 'I',
    Ó: 'O',
    Ú: 'U',
  };

  // Remove non-letter characters and replace accented characters with their unaccented counterparts
  text = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); // Remove non-letter characters except "ñ"
  text = text.replace(/[áéíóúÁÉÍÓÚ]/g, (match) => accentMap[match] || match); // Replace accented characters

  // Trim leading and trailing spaces, and replace multiple spaces with a single space
  text = text.trim().replace(/\s+/g, ' ');

  return text;
};

/**
 * Formats a person's name to show their first name(s) and only the first last name,
 * formatted in Camel/Title Case (e.g., "Juan Carlos Peña" from "JUAN CARLOS PEÑA MERLANO").
 *
 * @param {string} [firstName] - The first name(s) or single combined string.
 * @param {string} [lastName] - The last name(s).
 * @returns {string} The formatted name.
 */
export const formatPersonShortName = (firstName?: string, lastName?: string): string => {
  let cleanFirst = firstName?.trim() || '';
  let cleanLast = lastName?.trim() || '';

  if (cleanFirst && !cleanLast && cleanFirst.includes(' ')) {
    const parts = cleanFirst.split(/\s+/);
    cleanFirst = parts[0];
    cleanLast = parts.slice(1).join(' ');
  }

  const formattedFirst = capitalizeWords(cleanFirst);
  const firstLastName = capitalizeWords(cleanLast.split(/\s+/)?.[0] || '');

  if (formattedFirst && firstLastName) {
    return `${formattedFirst} ${firstLastName}`.trim();
  }
  return formattedFirst || firstLastName || '';
};

/**
 * Formats a person's name to show only their first given name and their full last name(s),
 * formatted in Title Case (e.g., "Carlos Toro Cortina" from firstName: "Carlos Andres", lastName: "Toro Cortina").
 *
 * @param {string} [firstName] - The first name(s).
 * @param {string} [lastName] - The last name(s).
 * @returns {string} The formatted name.
 */
export const formatPersonFirstAndLastNames = (firstName?: string, lastName?: string): string => {
  const firstFirstName = firstName?.trim()?.split(/\s+/)?.[0] || '';
  const fullLastName = lastName?.trim() || '';
  const combined = [firstFirstName, fullLastName].filter(Boolean).join(' ');
  return capitalizeWords(combined);
};

export interface EntitySearchParams {
  filterByFirstName?: string;
  filterByLastName?: string;
  numericId?: string;
}

/**
 * Parses raw search input for entity search bars (kids and users) according to search rules:
 * 1. If composed strictly of digits, treats input as numeric ID (userCode or nationalId).
 * 2. If it starts with a space (e.g. " Peña"), searches solely by last name.
 * 3. The first word is parsed as firstName.
 * 4. All remaining words (second in adelante) are parsed as lastName.
 *
 * @param {string} [rawText] - Raw text from the search input.
 * @returns {EntitySearchParams} Structured search filters.
 */
export const parseEntitySearchParams = (rawText?: string): EntitySearchParams => {
  if (!rawText) {
    return {};
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {};
  }

  // Rule 4: Pure digits -> ID search
  if (/^\d+$/.test(trimmed)) {
    return { numericId: trimmed };
  }

  // Rule 3: Starts with a space -> only search by last name
  if (rawText.startsWith(' ')) {
    return {
      filterByLastName: trimmed,
    };
  }

  // Rule 1 & 2: First word is firstName; second word and onwards is lastName
  const firstSpaceIndex = rawText.indexOf(' ');
  if (firstSpaceIndex === -1) {
    return {
      filterByFirstName: trimmed,
    };
  }

  const firstName = rawText.substring(0, firstSpaceIndex).trim();
  const lastName = rawText.substring(firstSpaceIndex + 1).trim();

  return {
    filterByFirstName: firstName || undefined,
    filterByLastName: lastName || undefined,
  };
};

/**
 * Formats a phone number with its country dial code and legible mask spacing.
 * Prevents duplicating the dial code if the number already begins with '+'.
 *
 * @param {string} [phone] - The phone number.
 * @param {string} [dialCode] - The country dial code (e.g. "+57", "57").
 * @returns {string} The formatted phone string with dial code and masking, or empty string if no phone provided.
 */
export const formatPhoneWithDialCode = (phone?: string, dialCode?: string): string => {
  if (!phone || !phone.trim()) {
    return '';
  }
  const cleanPhone = phone.trim();
  if (cleanPhone.startsWith('+')) {
    // Si ya empieza con '+', intentar extraer el indicativo o enmascarar directamente
    return cleanPhone;
  }
  return formatPhoneDisplay(cleanPhone, dialCode);
};

