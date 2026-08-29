/**
 * Capitalizes the first letter of every word in the given string.
 *
 * @param {string} [input] - The input string to capitalize.
 * @returns {string} The capitalized string, or an empty string if input is falsy.
 */
export const capitalizeWords = (input?: string): string => {
  if (!input) {
    return '';
  }

  if (input.length === 0) {
    return input;
  }

  const words = input.split(' ');
  const capitalizedWords = words.map((word) => {
    const firstChar = word.charAt(0).toUpperCase();
    const restOfString = word.slice(1).toLowerCase();
    return firstChar + restOfString;
  });

  return capitalizedWords.join(' ');
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
  };

  // Remove non-letter characters and replace accented characters with their unaccented counterparts
  text = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); // Remove non-letter characters except "ñ"
  text = text.replace(/[áéíóú]/g, (match) => accentMap[match] || match); // Replace accented characters

  // Trim leading and trailing spaces, and replace multiple spaces with a single space
  text = text.trim().replace(/\s+/g, ' ');

  return text;
};

/**
 * Formats a person's name to show their first name(s) and only the first last name,
 * formatted in Camel/Title Case (e.g., "Juan Carlos Peña" from "JUAN CARLOS PEÑA MERLANO").
 *
 * @param {string} [firstName] - The first name(s).
 * @param {string} [lastName] - The last name(s).
 * @returns {string} The formatted name.
 */
export const formatPersonShortName = (firstName?: string, lastName?: string): string => {
  const cleanFirst = capitalizeWords(firstName?.trim() || '');
  const firstLastName = capitalizeWords(lastName?.trim()?.split(/\s+/)?.[0] || '');

  if (cleanFirst && firstLastName) {
    return `${cleanFirst} ${firstLastName}`.trim();
  }
  return cleanFirst || firstLastName || '';
};

export interface EntitySearchParams {
  filterByFirstName?: string;
  filterByLastName?: string;
  numericId?: string;
}

/**
 * Parses raw search input for entity search bars (kids and users) according to search rules:
 * 1. If composed strictly of digits, treats input as numeric ID (faithForgeId or nationalId).
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

