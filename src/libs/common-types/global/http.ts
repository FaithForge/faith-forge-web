const defaultApiBaseUrl =
  import.meta.env.MODE !== 'production'
    ? 'http://faith-forge.com/api'
    : 'https://faith-forge.jucarlospm.com/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;

export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
