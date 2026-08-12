import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { ChurchMeetingStateEnum } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../../store';

export const GetChurchCampuses = createAsyncThunk(
  'church/GetChurchCampuses',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-campus`,
        options: {
          params: { churchId: process.env.NEXT_PUBLIC_CHURCH_ID },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);

export const GetChurchMeetings = createAsyncThunk(
  'church/GetChurchMeetings',
  async (payload: { churchCampusId: string; state?: string }, { getState }) => {
    const { churchCampusId, state: stateMeeting } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-meeting`,
        options: {
          params: { churchCampusId, state: stateMeeting },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
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
    allStates.forEach((s) => searchParams.append('states[]', s));

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
  async (churchCampusId: string, { getState }) => {
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
);
