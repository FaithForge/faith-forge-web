/**
 * Parses a JWT token and returns its payload object.
 *
 * @param {string} token - The JWT token string.
 * @returns {any|undefined} The decoded payload object, or `undefined` if token is falsy.
 */
export const parseJwt = (token: string) => {
  if (!token) {
    return;
  }
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
};
