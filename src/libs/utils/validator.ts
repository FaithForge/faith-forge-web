/**
 * Validates that the last name field contains at least two words.
 *
 * @param {string} value - The last name value to validate.
 * @returns {boolean | string} True if valid, or error message string if invalid.
 */
export const validateTwoLastNames = (value?: string) => {
  if (!value || !value.trim()) return 'El apellido es requerido';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'Se deben colocar ambos apellidos';
  }
  return true;
};

export const checkLastNameField = (_: any, value: string) => {
  const lastNameArray = value.trim().split(' ');

  if (lastNameArray.length >= 2) {
    return Promise.resolve();
  }
  return Promise.reject();
};
