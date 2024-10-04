import { HttpRequestMethod, MS } from '@faith-forge-web/common-types/global';
import { microserviceApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';

export const GetChurches = createAsyncThunk(
  'church/GetChurches',
  async (withAdditionalData: boolean, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/churches`,
        options: {
          params: {
            withAdditionalData,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);

export const GetChurchMeetings = createAsyncThunk(
  'church/GetChurchMeetings',
  async (payload: { churchId: string; state?: string }, { getState }) => {
    const { churchId, state: stateMeeting } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church/${churchId}/meetings`,
        options: {
          params: {
            state: stateMeeting,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);

export const GetChurchPrinters = createAsyncThunk(
  'church/GetChurchPrinters',
  async (churchId: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church/${churchId}/printers`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);
