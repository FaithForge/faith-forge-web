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
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return undefined;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return undefined;
  }
};

/**
 * Checks if a JWT token is missing, invalid, or expired.
 *
 * @param {string | undefined} token - The JWT token string.
 * @returns {boolean} True if the token is expired or invalid.
 */
export const isTokenExpired = (token?: string): boolean => {
  if (!token) return true;
  try {
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') return false;
    // payload.exp is in epoch seconds
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

