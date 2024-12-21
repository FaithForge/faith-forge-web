export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://faith-forge.com/api'
    : 'https://faith-forge.jucarlospm.com/api';

export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
