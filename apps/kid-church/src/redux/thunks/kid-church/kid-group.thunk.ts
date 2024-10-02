import { HttpRequestMethod } from '@faith-forge-web/common-types/global';
import { makeApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { MS_KID_CHURCH_PATH } from '../../../api';
import { RootState } from '../../store';

export const GetKidGroups = createAsyncThunk(
  'kid-church/GetKidGroups',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        HttpRequestMethod.GET,
        `/${MS_KID_CHURCH_PATH}/kid-groups`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    ).data;

    return response;
  }
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
        HttpRequestMethod.GET,
        `/${MS_KID_CHURCH_PATH}/kid-group/registered`,
        {
          params: {
            kidGroupId,
            churchMeetingId: churchMeetingSlice.current?.id,
            date: DateTime.fromJSDate(date).toISODate(),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    ).data;

    return response;
  }
);
