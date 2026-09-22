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

import { ProblemDetails } from '@/libs/models/problemDetails';

export interface ApiCustomError {
  status?: number;
  data?: unknown;
  message?: string;
  code?: string;
  detail?: string;
  problemDetails?: ProblemDetails;
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
    const errorObj = err as any;

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

    const problemDetails: ProblemDetails | undefined =
      errorObj?.problemDetails || errorObj?.response?.data?.error;
    const code: string | undefined = problemDetails?.code || errorObj?.code;
    const detail: string | undefined =
      problemDetails?.detail || problemDetails?.message || errorObj?.message;

    // Safety net: If an unrecoverable 401 reaches RTK Query, trigger unauthorized session expiration
    if (
      (errorObj?.response?.status === 401 || errorObj?.status === 401) &&
      !url?.includes('/user/login')
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return {
      error: {
        status: errorObj?.response?.status,
        data: errorObj?.response?.data,
        message: detail || 'Error de conexión',
        code,
        detail,
        problemDetails,
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
    'KidAttendanceTracking',
    'KidGuardian',
    'KidMedicalCondition',
    'ChurchMeeting',
    'ChurchCampus',
    'ChurchPrinter',
    'Volunteer',
    'User',
    'UserOverview',
    'Notification',
    'UserTerms',
  ],

  refetchOnReconnect: true,
  refetchOnFocus: false,
  endpoints: () => ({}),
});
