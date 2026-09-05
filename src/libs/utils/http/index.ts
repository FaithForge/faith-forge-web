/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpRequestMethod, MicroserviceEnum, API_BASE_URL } from '@/libs/common-types/global';
import axios, { AxiosResponse } from 'axios';

export interface ApiRequestOptions {
  params?: any;
  data?: any;
  headers?: any;
  responseType?: any;
  cache?: boolean;
  forceRefresh?: boolean;
  _retry?: boolean;
}

/**
 * Endpoints that return static catalog or master data which rarely change
 * during active sessions and should be cached in memory to prevent unnecessary 304 roundtrips.
 */
const CATALOG_ENDPOINTS = [
  '/church-campus',
  '/church-meeting',
  '/church-printers',
  '/kid-groups',
  '/kid-medical-conditions',
  '/kid-guardian',
  '/user/search-by-national-id',
];

// In-memory cache for catalog GET requests
const memoryHttpCache = new Map<string, AxiosResponse<any, any>>();

/**
 * Clears the entire in-memory HTTP cache (e.g. on logout or app reset).
 */
export const clearHttpCache = (): void => {
  memoryHttpCache.clear();
};

/**
 * Invalidates cached items matching a URL pattern (e.g. after mutating church-meeting states).
 *
 * @param {string} pattern - Substring pattern to purge from cache.
 */
export const invalidateHttpCachePattern = (pattern: string): void => {
  for (const key of memoryHttpCache.keys()) {
    if (key.includes(pattern)) {
      memoryHttpCache.delete(key);
    }
  }
};

/**
 * Checks if a given URL is a catalog endpoint that should be cached in memory.
 *
 * @param {string} url - The endpoint path.
 * @returns {boolean} True if cacheable.
 */
const isCatalogEndpoint = (url: string): boolean => {
  return CATALOG_ENDPOINTS.some((ep) => url.startsWith(ep));
};

// --- Refresh Token Mechanism ---
type RefreshTokenGetter = () => string | undefined;
type TokenRefreshHandler = (token: string, refreshToken?: string) => void;

let getRefreshTokenFn: RefreshTokenGetter | null = null;
let onTokenRefreshedFn: TokenRefreshHandler | null = null;

/**
 * Registers session callbacks so the HTTP client can retrieve the refresh token
 * and notify the Redux store when tokens are silently rotated.
 *
 * @param {Object} handlers - Handler functions.
 * @param {RefreshTokenGetter} handlers.getRefreshToken - Callback to get current refresh token.
 * @param {TokenRefreshHandler} handlers.onTokenRefreshed - Callback when tokens are refreshed.
 */
export const setHttpAuthHandlers = (handlers: {
  getRefreshToken: RefreshTokenGetter;
  onTokenRefreshed: TokenRefreshHandler;
}): void => {
  getRefreshTokenFn = handlers.getRefreshToken;
  onTokenRefreshedFn = handlers.onTokenRefreshed;
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * Performs silent refresh by exchanging the refresh token with User MS.
 *
 * @returns {Promise<string>} The new access token.
 */
const triggerSilentRefresh = async (): Promise<string> => {
  const currentRefreshToken = getRefreshTokenFn ? getRefreshTokenFn() : undefined;
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${API_BASE_URL}/ms-user/user/refresh-token`, {
    refreshToken: currentRefreshToken,
  });

  const { token: newToken, refreshToken: newRefreshToken } = response.data;
  if (!newToken) {
    throw new Error('Invalid refresh token response');
  }

  if (onTokenRefreshedFn) {
    onTokenRefreshedFn(newToken, newRefreshToken);
  }

  return newToken;
};

/**
 * Executes an API request using the specified method, URL, and options.
 * Caches catalog GET requests in memory to eliminate redundant 304 network roundtrips.
 * Handles silent token refresh and retries failed requests on HTTP 401.
 * Dispatches an 'auth:unauthorized' event globally if refresh fails.
 *
 * @param {string} baseURL - The base URL of the API.
 * @param {HttpRequestMethod} method - The HTTP method to use for the request.
 * @param {string} url - The endpoint URL relative to the base URL.
 * @param {ApiRequestOptions} [options={}] - The optional parameters, data, and headers for the request.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 * @throws {Error} If an invalid HTTP method is provided or on request failure.
 */
const executeApiRequest = async (
  baseURL: string,
  method: HttpRequestMethod,
  url: string,
  options: ApiRequestOptions = {},
): Promise<AxiosResponse<any, any>> => {
  const { params = {}, data = {}, headers = {}, responseType, cache, forceRefresh } = options;

  // 1. In-memory cache evaluation for GET requests
  const shouldCache =
    method === HttpRequestMethod.GET &&
    !forceRefresh &&
    (cache === true || (cache !== false && isCatalogEndpoint(url)));

  const cacheKey = shouldCache
    ? `${baseURL}${url}?${JSON.stringify(params)}`
    : null;

  if (cacheKey && memoryHttpCache.has(cacheKey)) {
    return memoryHttpCache.get(cacheKey)!;
  }

  // 2. Cache invalidation on mutation requests
  if (method !== HttpRequestMethod.GET) {
    if (url.includes('church-meeting')) invalidateHttpCachePattern('church-meeting');
    if (url.includes('church-campus')) invalidateHttpCachePattern('church-campus');
    if (url.includes('kid-group')) invalidateHttpCachePattern('kid-group');
    if (url.includes('kid-medical-condition')) invalidateHttpCachePattern('kid-medical-condition');
    if (url.includes('kid-guardian')) invalidateHttpCachePattern('kid-guardian');
  }

  const instance = axios.create({ baseURL, timeout: 20000 });

  try {
    let response: AxiosResponse<any, any>;
    switch (method) {
      case HttpRequestMethod.GET:
        response = await instance.get(url, { params, headers, responseType });
        break;
      case HttpRequestMethod.POST:
        response = await instance.post(url, data, { headers, responseType });
        break;
      case HttpRequestMethod.PATCH:
        response = await instance.patch(url, data, { headers, responseType });
        break;
      case HttpRequestMethod.PUT:
        response = await instance.put(url, data, { headers, responseType });
        break;
      case HttpRequestMethod.DELETE:
        response = await instance.delete(url, { data, params, headers, responseType });
        break;
      default:
        throw new Error(`Invalid HTTP verb: ${method}`);
    }

    // Save successful GET response in memory cache
    if (cacheKey && response && response.status >= 200 && response.status < 300) {
      memoryHttpCache.set(cacheKey, response);
    }

    return response;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const isAuthEndpoint =
        url.includes('/user/login') ||
        url.includes('/user/refresh-token') ||
        url.includes('/user/logout');

      if (!isAuthEndpoint && !options._retry) {
        options._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await triggerSilentRefresh();
            onRefreshed(newToken);
            isRefreshing = false;

            const updatedHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            return executeApiRequest(baseURL, method, url, {
              ...options,
              headers: updatedHeaders,
            });
          } catch (refreshErr) {
            isRefreshing = false;
            refreshSubscribers = [];
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            throw refreshErr;
          }
        }

        // If a refresh is already in flight, queue this request to retry when ready
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              const updatedHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              };
              const retryResponse = await executeApiRequest(baseURL, method, url, {
                ...options,
                headers: updatedHeaders,
              });
              resolve(retryResponse);
            } catch (retryErr) {
              reject(retryErr);
            }
          });
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    throw error;
  }
};

/**
 * Makes an API request to a specific microservice.
 *
 * @param {Object} payload - The payload object containing details for the request.
 * @param {MicroserviceEnum} payload.microservice - The microservice to target.
 * @param {HttpRequestMethod} payload.method - The HTTP method to use.
 * @param {string} payload.url - The endpoint URL relative to the microservice.
 * @param {ApiRequestOptions} [payload.options] - Optional request parameters, data, and headers.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 */
export const microserviceApiRequest = async (payload: {
  microservice: MicroserviceEnum;
  method: HttpRequestMethod;
  url: string;
  options?: ApiRequestOptions;
}): Promise<AxiosResponse<any, any>> => {
  const { microservice, method, url, options } = payload;
  const baseURL = `${API_BASE_URL}/ms-${microservice}`;
  return executeApiRequest(baseURL, method, url, options);
};

/**
 * Makes a general API request to the base API URL.
 *
 * @param {HttpRequestMethod} method - The HTTP method to use.
 * @param {string} url - The endpoint URL relative to the base API URL.
 * @param {ApiRequestOptions} [options] - Optional request parameters, data, and headers.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 */
export const makeApiRequest = async (
  method: HttpRequestMethod,
  url: string,
  options?: ApiRequestOptions,
): Promise<AxiosResponse<any, any>> => {
  const baseURL = API_BASE_URL;
  return executeApiRequest(baseURL, method, url, options);
};
