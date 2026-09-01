import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import {
  GetVolunteerAttendancePayload,
  IVolunteerAttendance,
  PaginationResponse,
} from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

/**
 * Queries volunteer attendance records with pagination and category/date filters via GET /volunteer-attendance.
 *
 * @param {GetVolunteerAttendancePayload & { force?: boolean }} [payload] - Filter parameters.
 * @returns {Promise<PaginationResponse<IVolunteerAttendance>>} Paginated list of attendance records.
 */
export const GetVolunteerAttendance = createAsyncThunk(
  'church/GetVolunteerAttendance',
  async (
    payload: GetVolunteerAttendancePayload & { force?: boolean } = {},
    { getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const params: Record<string, string | number | boolean> = {};
    if (payload.page !== undefined) params.page = payload.page;
    if (payload.limit !== undefined) params.limit = payload.limit;
    if (payload.order) params.order = payload.order;
    if (payload.churchMeetingId) params.churchMeetingId = payload.churchMeetingId;
    if (payload.churchCampusId) params.churchCampusId = payload.churchCampusId;
    if (payload.ministryId) params.ministryId = payload.ministryId;
    if (payload.ministryAreaId) params.ministryAreaId = payload.ministryAreaId;
    if (payload.serviceAreaGroupId) params.serviceAreaGroupId = payload.serviceAreaGroupId;
    if (payload.volunteerAssignmentId) params.volunteerAssignmentId = payload.volunteerAssignmentId;
    if (payload.attendanceDate) params.attendanceDate = payload.attendanceDate;
    if (payload.from) params.from = payload.from;
    if (payload.to) params.to = payload.to;

    try {
      const response = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: '/volunteer-attendance',
          options: {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const isArray = Array.isArray(response);
      const data: IVolunteerAttendance[] = isArray ? response : response?.data || [];
      const currentPage: number = isArray ? 1 : response?.currentPage || 1;
      const totalPages: number = isArray ? 1 : response?.totalPages || 1;

      return {
        data,
        currentPage,
        totalPages,
      } as PaginationResponse<IVolunteerAttendance>;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(
        error.response?.data ?? 'Error al obtener asistencias de voluntarios',
      );
    }
  },
);
