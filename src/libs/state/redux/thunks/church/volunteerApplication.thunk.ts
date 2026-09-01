import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import {
  CreateVolunteerApplicationPayload,
  GetVolunteerApplicationsPayload,
  ICheckVolunteerUserResponse,
  IPublicVolunteerCatalog,
  IVolunteerApplication,
  PaginationResponse,
  RejectVolunteerApplicationPayload,
} from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

/**
 * Safely extracts a human-readable string error message from an unknown error or Axios response.
 *
 * @param {unknown} err - Error caught in thunk.
 * @param {string} fallback - Default message if none is extracted.
 * @returns {string} Clean string error message.
 */
export const extractThunkErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<any>;
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data) {
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
    if (typeof data.message === 'object' && data.message !== null) {
      const inner = (data.message as any).message;
      if (typeof inner === 'string') return inner;
      if (Array.isArray(inner)) return inner.join(', ');
    }
    if (typeof data.error === 'string') return data.error;
  }
  if (typeof error?.message === 'string') return error.message;
  return fallback;
};

/**
 * Fetches the public catalog of campuses, areas, groups, and roles without authentication.
 *
 * @param {string} [churchId] - Optional church ID.
 * @returns {Promise<IPublicVolunteerCatalog>} Catalog containing campuses, areas, groups, and roles.
 */
export const GetPublicVolunteerCatalog = createAsyncThunk(
  'church/GetPublicVolunteerCatalog',
  async (churchId: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer-application/catalog',
          options: {
            params: churchId ? { churchId } : {},
          },
        })
      ).data;

      return response as IPublicVolunteerCatalog;
    } catch (err) {
      return rejectWithValue(
        extractThunkErrorMessage(err, 'Error al cargar el catálogo de voluntariado')
      );
    }
  },
);

/**
 * Checks if a user already exists by document type and national ID, returning masked data.
 *
 * @param {{ nationalId: string; nationalIdType?: string }} params - Identification query.
 * @returns {Promise<ICheckVolunteerUserResponse>} Masked result.
 */
export const CheckVolunteerUser = createAsyncThunk(
  'church/CheckVolunteerUser',
  async (
    params: { nationalId: string; nationalIdType?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer-application/check-user',
          options: {
            params,
          },
        })
      ).data;

      return response as ICheckVolunteerUserResponse;
    } catch (err) {
      return rejectWithValue(
        extractThunkErrorMessage(err, 'Error al verificar el documento')
      );
    }
  },
);

/**
 * Submits a public volunteer application form from the QR registration view.
 *
 * @param {CreateVolunteerApplicationPayload} payload - Application details.
 * @returns {Promise<{ message: string; id: string }>} Server confirmation.
 */
export const CreateVolunteerApplication = createAsyncThunk(
  'church/CreateVolunteerApplication',
  async (payload: CreateVolunteerApplicationPayload, { rejectWithValue }) => {
    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/volunteer-application',
          options: {
            data: payload,
          },
        })
      ).data;

      return response as { message: string; id: string };
    } catch (err) {
      return rejectWithValue(
        extractThunkErrorMessage(err, 'Error al registrar la postulación')
      );
    }
  },
);

/**
 * Fetches volunteer applications visible within the coordinator's authority scope.
 *
 * @param {GetVolunteerApplicationsPayload} [payload] - Query filters and pagination.
 * @returns {Promise<PaginationResponse<IVolunteerApplication>>} Paginated list of applications.
 */
export const GetVolunteerApplications = createAsyncThunk(
  'church/GetVolunteerApplications',
  async (payload: GetVolunteerApplicationsPayload = {}, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string | number | boolean> = {};
    if (payload.page !== undefined) params.page = payload.page;
    if (payload.limit !== undefined) params.limit = payload.limit;
    if (payload.order) params.order = payload.order;
    if (payload.status) params.status = payload.status;
    if (payload.churchCampusId) params.churchCampusId = payload.churchCampusId;
    if (payload.ministryAreaId) params.ministryAreaId = payload.ministryAreaId;
    if (payload.ministryGroupConfigId) params.ministryGroupConfigId = payload.ministryGroupConfigId;
    if (payload.search && payload.search.trim()) params.search = payload.search.trim();

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer-application',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const isArray = Array.isArray(response);
      const rawApps: IVolunteerApplication[] = isArray ? response : response?.data || [];
      const currentPage: number = isArray ? 1 : response?.currentPage || 1;
      const totalPages: number = isArray ? 1 : response?.totalPages || 1;

      return {
        data: rawApps,
        currentPage,
        totalPages,
      } as PaginationResponse<IVolunteerApplication>;
    } catch (err) {
      return rejectWithValue(
        extractThunkErrorMessage(err, 'Error al obtener las postulaciones de servidores')
      );
    }
  },
);

/**
 * Approves a volunteer application and assigns the volunteer to the requested group/area.
 *
 * @param {string} id - Application UUID.
 * @returns {Promise<IVolunteerApplication>} Approved application record.
 */
export const ApproveVolunteerApplication = createAsyncThunk(
  'church/ApproveVolunteerApplication',
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: `/volunteer-application/${id}/approve`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IVolunteerApplication;
    } catch (err) {
      return rejectWithValue(
        extractThunkErrorMessage(err, 'Error al aprobar la postulación')
      );
    }
  },
);

/**
 * Rejects a volunteer application with an optional reason message.
 *
 * @param {RejectVolunteerApplicationPayload} payload - Target application ID and optional reason.
 * @returns {Promise<IVolunteerApplication>} Rejected application record.
 */
export const RejectVolunteerApplication = createAsyncThunk(
  'church/RejectVolunteerApplication',
  async (payload: RejectVolunteerApplicationPayload, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: `/volunteer-application/${payload.id}/reject`,
          options: {
            data: { reason: payload.reason },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IVolunteerApplication;
    } catch (err) {
      return rejectWithValue(
        extractThunkErrorMessage(err, 'Error al rechazar la postulación')
      );
    }
  },
);
