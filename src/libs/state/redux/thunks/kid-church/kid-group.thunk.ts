import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { KidGroupType } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { RootState } from '../../store';

export const GetKidGroups = createAsyncThunk(
  'kid-church/GetKidGroups',
  async (payload: { type?: KidGroupType }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid-groups`,
        options: {
          params: payload
            ? {
                type: payload.type,
              }
            : {},
          headers: { Authorization: `Bearer ${token}` },
        },
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
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid-group/registered`,
        options: {
          params: {
            kidGroupId,
            churchMeetingId: churchMeetingSlice.current?.id,
            date: DateTime.fromJSDate(date).toISODate(),
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
);
