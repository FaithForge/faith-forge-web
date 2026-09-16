import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react';
import { HttpRequestMethod, MicroserviceEnum } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { enqueueOfflineMutation } from '@/libs/utils/offlineQueue';
import { RootState } from '../store';

export interface MicroserviceBaseQueryArgs {
  microservice: MicroserviceEnum;
  url: string;
  method?: HttpRequestMethod;
  data?: unknown;
  params?: any;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  queueIfOffline?: boolean;
}

export interface ApiCustomError {
  status?: number;
  data?: unknown;
  message?: string;
}

/**
 * Custom RTK Query baseQuery function that integrates with the application's
 * centralized HTTP client, JWT silent refresh mechanism, and offline queue.
 */
export const microserviceBaseQuery: BaseQueryFn<
  MicroserviceBaseQueryArgs,
  unknown,
  ApiCustomError
> = async (args, api) => {
  const {
    microservice,
    url,
    method = HttpRequestMethod.GET,
    data,
    params,
    headers = {},
    idempotencyKey,
    queueIfOffline = false,
  } = args;

  const state = api.getState() as RootState;
  const token = state.authSlice?.token;

  const requestHeaders: Record<string, string> = { ...headers };
  if (token && !requestHeaders['Authorization']) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }
  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = idempotencyKey;
  }

  try {
    const response = await microserviceApiRequest({
      microservice,
      method,
      url,
      options: {
        data,
        params,
        headers: requestHeaders,
      },
    });

    return { data: response.data };
  } catch (err: unknown) {
    const errorObj = err as {
      code?: string;
      message?: string;
      response?: { status?: number; data?: unknown };
    };

    const isOffline =
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      errorObj?.code === 'ERR_NETWORK' ||
      errorObj?.message?.includes('Network Error');

    // Automatic offline queueing for mutations if requested or offline
    if (isOffline && method !== HttpRequestMethod.GET && queueIfOffline) {
      enqueueOfflineMutation({
        microservice,
        method,
        url,
        data,
        params,
        idempotencyKey,
      });
    }

    return {
      error: {
        status: errorObj?.response?.status,
        data: errorObj?.response?.data,
        message: errorObj?.message || 'Error de conexión',
      },
    };
  }
};

/**
 * Core RTK Query API slice with defined tag types for cache invalidation.
 * Microservice-specific endpoints are injected modularly via injectEndpoints.
 */
export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: microserviceBaseQuery,
  tagTypes: [
    'Kid',
    'KidGroup',
    'KidRegistered',
    'KidGuardian',
    'KidMedicalCondition',
    'ChurchMeeting',
    'ChurchCampus',
    'ChurchPrinter',
    'Volunteer',
    'User',
  ],
  refetchOnReconnect: true,
  refetchOnFocus: false,
  endpoints: () => ({}),
});
