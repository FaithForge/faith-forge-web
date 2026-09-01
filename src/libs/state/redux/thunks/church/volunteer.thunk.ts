import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import {
  GetVolunteerAssignmentsPayload,
  GetVolunteersPayload,
  IVolunteer,
  IVolunteerAssignment,
  PaginationResponse,
  VolunteerRole,
} from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

/**
 * Fetches the first page of volunteers, filtered by optional ministry, campus, role, search, or status,
 * via GET /volunteer (backend now includes enriched user profile).
 *
 * @param {GetVolunteersPayload & { force?: boolean }} [payload] - Query parameters and force flag.
 * @returns {Promise<PaginationResponse<IVolunteer>>} Paginated list of enriched volunteers.
 */
export const GetVolunteers = createAsyncThunk(
  'church/GetVolunteers',
  async (
    payload: GetVolunteersPayload & { force?: boolean } = {},
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string | number | boolean> = {};
    if (payload.page !== undefined) params.page = payload.page;
    if (payload.limit !== undefined) params.limit = payload.limit;
    if (payload.order) params.order = payload.order;
    if (payload.ministryId) params.ministryId = payload.ministryId;
    if (payload.churchCampusId) params.churchCampusId = payload.churchCampusId;
    if (payload.role) params.role = payload.role;
    if (payload.search && payload.search.trim()) params.search = payload.search.trim();
    if (payload.active !== undefined) params.active = payload.active;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const isArray = Array.isArray(response);
      const rawVolunteers: IVolunteer[] = isArray ? response : response?.data || [];
      const currentPage: number = isArray ? 1 : response?.currentPage || 1;
      const totalPages: number = isArray ? 1 : response?.totalPages || 1;

      return {
        data: rawVolunteers,
        currentPage,
        totalPages,
      } as PaginationResponse<IVolunteer>;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener voluntarios');
    }
  },
);

/**
 * Fetches the next page of volunteers for infinite scroll.
 *
 * @param {GetVolunteersPayload} [payload] - Pagination and category filter payload.
 * @returns {Promise<PaginationResponse<IVolunteer>>} Next page of volunteers.
 */
export const GetMoreVolunteers = createAsyncThunk(
  'church/GetMoreVolunteers',
  async (payload: GetVolunteersPayload = {}, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string | number | boolean> = {};
    if (payload.page !== undefined) params.page = payload.page;
    if (payload.limit !== undefined) params.limit = payload.limit;
    if (payload.order) params.order = payload.order;
    if (payload.ministryId) params.ministryId = payload.ministryId;
    if (payload.churchCampusId) params.churchCampusId = payload.churchCampusId;
    if (payload.role) params.role = payload.role;
    if (payload.search && payload.search.trim()) params.search = payload.search.trim();
    if (payload.active !== undefined) params.active = payload.active;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const isArray = Array.isArray(response);
      const rawVolunteers: IVolunteer[] = isArray ? response : response?.data || [];
      const currentPage: number = isArray ? 1 : response?.currentPage || 1;
      const totalPages: number = isArray ? 1 : response?.totalPages || 1;

      return {
        data: rawVolunteers,
        currentPage,
        totalPages,
      } as PaginationResponse<IVolunteer>;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al cargar más voluntarios');
    }
  },
);

/**
 * Registers a user as a volunteer in Church MS via POST /volunteer
 * and enriches the record with the user profile from User MS.
 *
 * @param {Object} payload - Volunteer creation payload.
 * @param {string} payload.userId - User identifier from User MS.
 * @returns {Promise<IVolunteer>} The created and enriched volunteer record.
 */
export const CreateVolunteer = createAsyncThunk(
  'church/CreateVolunteer',
  async (payload: { userId: string }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/volunteer',
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const created = response as IVolunteer;
      if (created.user) return created;

      // Enrich with User MS data immediately if not present
      try {
        const userRes = (
          await microserviceApiRequest({
            microservice: MS.User,
            method: HttpRequestMethod.GET,
            url: `/user/${payload.userId}`,
            options: {
              headers: { Authorization: `Bearer ${token}` },
            },
          })
        ).data;
        return {
          ...created,
          user: userRes,
        };
      } catch {
        return created;
      }
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al registrar voluntario');
    }
  },
);


/**
 * Queries volunteer assignments by scope or role via GET /volunteer-assignment
 * and normalizes volunteer information.
 *
 * @param {GetVolunteerAssignmentsPayload & { force?: boolean; partitionKey?: string }} [payload] - Search query parameters.
 * @returns {Promise<{ data: IVolunteerAssignment[]; totalPages: number; currentPage: number; partitionKey?: string }>} List of volunteer assignments.
 */
export const GetVolunteerAssignments = createAsyncThunk(
  'church/GetVolunteerAssignments',
  async (
    payload: GetVolunteerAssignmentsPayload & {
      force?: boolean;
      partitionKey?: string;
    } = {},
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string | number | boolean> = {};
    if (payload.page !== undefined) params.page = payload.page;
    if (payload.limit !== undefined) params.limit = payload.limit;
    if (payload.order) params.order = payload.order;
    if (payload.ministryId) params.ministryId = payload.ministryId;
    if (payload.churchCampusId) params.churchCampusId = payload.churchCampusId;
    if (payload.ministryAreaId) params.ministryAreaId = payload.ministryAreaId;
    if (payload.ministryGroupConfigId) params.ministryGroupConfigId = payload.ministryGroupConfigId;
    if (payload.serviceAreaGroupId) params.serviceAreaGroupId = payload.serviceAreaGroupId;
    if (payload.volunteerId) params.volunteerId = payload.volunteerId;
    if (payload.role) params.role = payload.role;
    if (payload.active !== undefined) params.active = payload.active;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer-assignment',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const isArray = Array.isArray(response);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawAssignments = (isArray ? response : response?.data || []) as any[];
      const currentPage = isArray ? 1 : response?.currentPage || 1;
      const totalPages = isArray ? 1 : response?.totalPages || 1;

      const normalizedAssignments = rawAssignments.map((asg) => {
        const volunteer = asg.volunteer || asg.ministryVolunteer || {};
        const volunteerId = asg.volunteerId || asg.ministryVolunteerId || volunteer.id;
        const user = asg.user || volunteer.user;

        return {
          ...asg,
          volunteerId,
          volunteer: {
            ...volunteer,
            id: volunteer.id || volunteerId,
            userId: volunteer.userId || user?.id,
            user,
          },
        } as IVolunteerAssignment;
      });

      return {
        data: normalizedAssignments,
        totalPages,
        currentPage,
        partitionKey: payload.partitionKey,
      };
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener asignaciones de voluntarios');
    }
  },
);

/**
 * Assigns a volunteer to a role and scope via POST /volunteer-assignment.
 *
 * @param {Object} payload - Assignment creation payload.
 * @param {string} payload.volunteerId - Volunteer identifier.
 * @param {VolunteerRole} payload.role - Role to assign.
 * @param {string} [payload.serviceAreaGroupId] - Target service area group.
 * @param {string} [payload.ministryGroupConfigId] - Target group config.
 * @param {string} [payload.ministryAreaId] - Target ministry area.
 * @param {string} [payload.ministryId] - Target ministry.
 * @returns {Promise<IVolunteerAssignment>} The created assignment.
 */
export const CreateVolunteerAssignment = createAsyncThunk(
  'church/CreateVolunteerAssignment',
  async (
    payload: {
      volunteerId: string;
      role: VolunteerRole;
      serviceAreaGroupId?: string;
      ministryGroupConfigId?: string;
      ministryAreaId?: string;
      ministryId?: string;
    },
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.POST,
          url: '/volunteer-assignment',
          options: {
            data: payload,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IVolunteerAssignment;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al crear asignación');
    }
  },
);

/**
 * Updates a volunteer assignment via PUT /volunteer-assignment/:id.
 *
 * @param {Object} payload - Assignment update payload.
 * @param {string} payload.id - Assignment identifier.
 * @param {VolunteerRole} [payload.role] - Updated role.
 * @param {boolean} [payload.active] - Active status flag.
 * @returns {Promise<IVolunteerAssignment>} The updated assignment.
 */
export const UpdateVolunteerAssignment = createAsyncThunk(
  'church/UpdateVolunteerAssignment',
  async (
    payload: { id: string; role?: VolunteerRole; active?: boolean },
    { getState, rejectWithValue },
  ) => {
    const { id, ...data } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.PUT,
          url: `/volunteer-assignment/${id}`,
          options: {
            data,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      return response as IVolunteerAssignment;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al actualizar la asignación');
    }
  },
);

/**
 * Removes a volunteer assignment via DELETE /volunteer-assignment/:id.
 *
 * @param {Object} payload - Payload containing assignment ID.
 * @param {string} payload.id - Assignment identifier.
 * @returns {Promise<string>} The deleted assignment ID.
 */
export const DeleteVolunteerAssignment = createAsyncThunk(
  'church/DeleteVolunteerAssignment',
  async (payload: { id: string }, { getState, rejectWithValue }) => {
    const { id } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.DELETE,
        url: `/volunteer-assignment/${id}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      return id;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al eliminar la asignación');
    }
  },
);

/**
 * Fetches all assignments for a specific volunteer via GET /volunteer/:id/assignments.
 *
 * @param {Object} payload - Payload with volunteerId.
 * @param {string} payload.volunteerId - Volunteer identifier.
 * @returns {Promise<IVolunteerAssignment[]>} List of assignments for the volunteer.
 */
export const GetVolunteerWithAssignments = createAsyncThunk(
  'church/GetVolunteerWithAssignments',
  async (payload: { volunteerId: string }, { getState, rejectWithValue }) => {
    const { volunteerId } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: `/volunteer/${volunteerId}/assignments`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      // Backend returns either an array or an object with .assignments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignmentsList = Array.isArray(response)
        ? response
        : (response?.assignments || []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return assignmentsList.map((asg: any) => ({
        ...asg,
        volunteerId: asg.volunteerId || asg.ministryVolunteerId,
        volunteer: asg.volunteer || asg.ministryVolunteer,
      })) as IVolunteerAssignment[];
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data ?? 'Error al obtener asignaciones del voluntario',
      );
    }
  },
);
