import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest, MS_CHURCH_PATH } from '../../../api';
import { RootState } from '../../store';

export const GetChurches = createAsyncThunk(
  'church/GetChurches',
  async (withAdditionalData: boolean, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_CHURCH_PATH}/churches`, {
        params: {
          withAdditionalData,
        },
        headers: { Authorization: `Bearer ${token}` },
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
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_CHURCH_PATH}/church/${churchId}/meetings`,
        {
          params: {
            state: stateMeeting,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
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
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_CHURCH_PATH}/church/${churchId}/printers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;
    return response;
  },
);
