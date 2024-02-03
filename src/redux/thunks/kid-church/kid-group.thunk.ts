import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

export const GetKidGroups = createAsyncThunk(
  'kid-church/GetKidGroups',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_KID_CHURCH_PATH}/kid-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;

    return response;
  },
);

export const GetKidGroupRegistered = createAsyncThunk(
  'kid-church/GetKidGroupRegistered',
  async (payload: { date: Date; kidGroupId?: string }, { getState }) => {
    const { date, kidGroupId } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchMeetingSlice = state.churchMeetingSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/kid-group/registered`,
        {
          params: {
            kidGroupId,
            churchMeetingId: churchMeetingSlice.current?.id,
            date: DateTime.fromJSDate(date).toISODate(),
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);
