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
