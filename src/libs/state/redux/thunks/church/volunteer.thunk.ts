import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { IVolunteer, IVolunteerAssignment, VolunteerRole } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

/**
 * Fetches volunteers, optionally filtered by ministry, via GET /volunteer
 * and enriches each volunteer with their user profile from User MS.
 *
 * @param {Object} [payload] - Search query parameters.
 * @param {string} [payload.ministryId] - Optional ministry identifier.
 * @param {boolean} [payload.force] - Force flag bypassing cache.
 * @returns {Promise<IVolunteer[]>} List of enriched volunteers.
 */
export const GetVolunteers = createAsyncThunk(
  'church/GetVolunteers',
  async (payload: { ministryId?: string; force?: boolean } = {}, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string> = {};
    if (payload.ministryId) {
      params.ministryId = payload.ministryId;
    }

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

      const rawVolunteers = (Array.isArray(response) ? response : []) as IVolunteer[];

      // Enrich volunteers with user data from User MS
      const enrichedVolunteers = await Promise.all(
        rawVolunteers.map(async (vol) => {
          if (vol.user && vol.user.firstName) return vol;
          const uId = vol.userId;
          if (!uId) return vol;

          try {
            const userRes = (
              await microserviceApiRequest({
                microservice: MS.User,
                method: HttpRequestMethod.GET,
                url: `/user/${uId}`,
                options: {
                  headers: { Authorization: `Bearer ${token}` },
                },
              })
            ).data;
            return {
              ...vol,
              user: userRes,
            };
          } catch {
            return vol;
          }
        }),
      );

      return enrichedVolunteers;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Error al obtener voluntarios');
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

      // Enrich with User MS data immediately so state has it right away
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
 * @param {Object} [payload] - Search query parameters.
 * @param {string} [payload.serviceAreaGroupId] - Filter by service area group.
 * @param {string} [payload.ministryId] - Filter by ministry.
 * @param {VolunteerRole} [payload.role] - Filter by role.
 * @param {boolean} [payload.force] - Force refresh flag.
 * @returns {Promise<IVolunteerAssignment[]>} List of volunteer assignments.
 */
export const GetVolunteerAssignments = createAsyncThunk(
  'church/GetVolunteerAssignments',
  async (
    payload: {
      serviceAreaGroupId?: string;
      ministryId?: string;
      role?: VolunteerRole;
      force?: boolean;
    } = {},
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string> = {};
    if (payload.serviceAreaGroupId) params.serviceAreaGroupId = payload.serviceAreaGroupId;
    if (payload.ministryId) params.ministryId = payload.ministryId;
    if (payload.role) params.role = payload.role;

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawAssignments = (Array.isArray(response) ? response : []) as any[];

      const normalizedAssignments = await Promise.all(
        rawAssignments.map(async (asg) => {
          const volunteer = asg.volunteer || asg.ministryVolunteer;
          const volunteerId = asg.volunteerId || asg.ministryVolunteerId;

          let enrichedVolunteer = volunteer;
          if (volunteer && !volunteer.user && volunteer.userId) {
            try {
              const userRes = (
                await microserviceApiRequest({
                  microservice: MS.User,
                  method: HttpRequestMethod.GET,
                  url: `/user/${volunteer.userId}`,
                  options: {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                })
              ).data;
              enrichedVolunteer = { ...volunteer, user: userRes };
            } catch {
              // ignore
            }
          }

          return {
            ...asg,
            volunteerId,
            volunteer: enrichedVolunteer,
          } as IVolunteerAssignment;
        }),
      );

      return normalizedAssignments;
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
