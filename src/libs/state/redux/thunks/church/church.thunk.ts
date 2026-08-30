import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { ChurchMeetingStateEnum } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../../store';

export const GetChurchCampuses = createAsyncThunk(
  'church/GetChurchCampuses',
  async (payload: { force?: boolean } | void, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-campus`,
        options: {
          params: { churchId: import.meta.env.VITE_CHURCH_ID },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
  {
    condition: (payload, { getState }) => {
      if (payload && typeof payload === 'object' && payload.force) return true;
      const state = getState() as RootState;
      const hasCampuses = (state.churchCampusSlice.data?.length ?? 0) > 0;
      return !hasCampuses;
    },
  },
);

export const GetChurchMeetings = createAsyncThunk(
  'church/GetChurchMeetings',
  async (
    payload: { churchCampusId: string; state?: string; states?: string[]; force?: boolean },
    { getState },
  ) => {
    const { churchCampusId, state: stateMeeting, states: statesList } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const statesToSend =
      statesList && statesList.length > 0
        ? statesList
        : stateMeeting
          ? [stateMeeting]
          : [ChurchMeetingStateEnum.ACTIVE];

    const searchParams = new URLSearchParams();
    searchParams.append('churchCampusId', churchCampusId);
    statesToSend.forEach((s) => searchParams.append('states', s));

    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-meeting?${searchParams.toString()}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
  {
    condition: (payload, { getState }) => {
      if (payload.force) return true;
      const state = getState() as RootState;
      const meetingSlice = state.churchMeetingSlice as any;
      const campusMeetings = meetingSlice.meetingsByCampus?.[payload.churchCampusId];
      const hasMeetingsForCampus = campusMeetings && campusMeetings.length > 0;
      return !hasMeetingsForCampus;
    },
  },
);

/**
 * Fetches all church meetings for a given campus, including all states.
 * Intended for the admin view where all states must be visible.
 *
 * @param {string} churchCampusId - The ID of the campus to fetch meetings for.
 * @returns {Promise<IChurchMeeting[]>} - All meetings for the campus across all states.
 */
export const GetAllChurchMeetingsAdmin = createAsyncThunk(
  'church/GetAllChurchMeetingsAdmin',
  async (churchCampusId: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const allStates = Object.values(ChurchMeetingStateEnum);

    const searchParams = new URLSearchParams();
    searchParams.append('churchCampusId', churchCampusId);
    allStates.forEach((s) => searchParams.append('states', s));

    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-meeting?${searchParams.toString()}`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
          forceRefresh: true,
        },
      })
    ).data;
    return response;
  },
);

/**
 * Sends a bulk state update for a list of church meetings.
 * Calls PATCH /church-meeting/bulk-state with the provided items.
 *
 * @param {{ id: string; state: ChurchMeetingStateEnum }[]} items - Array of meeting ID + new state pairs.
 * @returns {Promise<void>} - Resolves when the update is applied.
 */
export const BulkUpdateChurchMeetingStates = createAsyncThunk(
  'church/BulkUpdateChurchMeetingStates',
  async (items: { id: string; state: ChurchMeetingStateEnum }[], { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.PATCH,
        url: `/church-meeting/bulk-state`,
        options: {
          data: { items },
          headers: { Authorization: `Bearer ${token}` },
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data ?? 'Error al actualizar estados');
      }
      return rejectWithValue('Error desconocido');
    }
  },
);

export const GetChurchPrinters = createAsyncThunk(
  'church/GetChurchPrinters',
  async (payload: string | { churchCampusId: string; force?: boolean }, { getState }) => {
    const churchCampusId = typeof payload === 'string' ? payload : payload.churchCampusId;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-printers`,
        options: {
          params: { churchCampusId },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
  {
    condition: (payload, { getState }) => {
      const churchCampusId = typeof payload === 'string' ? payload : payload.churchCampusId;
      const force = typeof payload === 'object' && payload.force;
      if (force) return true;
      const state = getState() as RootState;
      const printerSlice = state.churchPrinterSlice as any;
      const campusPrinters = printerSlice.printersByCampus?.[churchCampusId];
      const hasPrintersForCampus = campusPrinters && campusPrinters.length > 0;
      return !hasPrintersForCampus;
    },
  },
);
