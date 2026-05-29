/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the last name field contains at least two words.
 *
 * @param {any} _ - Unused validation rule placeholder (provided by form library).
 * @param {string} value - The last name value to validate.
 * @returns {Promise<void>} Resolves when the validation passes, rejects when it fails.
 */
export const checkLastNameField = (_: any, value: string) => {
  const lastNameArray = value.trim().split(' ');

  if (lastNameArray.length >= 2) {
    return Promise.resolve();
  }
  return Promise.reject();
};
