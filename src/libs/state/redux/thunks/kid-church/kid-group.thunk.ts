import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { KidGroupType } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { RootState } from '../../store';

export const GetKidGroups = createAsyncThunk(
  'kid-church/GetKidGroups',
  async (payload: { type?: KidGroupType; force?: boolean } = {}, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid-groups`,
        options: {
          params: payload?.type
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
  {
    condition: (payload, { getState }) => {
      if (payload?.force) return true;
      const state = getState() as RootState;
      const groups = state.kidGroupSlice.data;
      if (!groups || groups.length === 0) return true;

      if (payload?.type === KidGroupType.SPECIAL) {
        const hasSpecial = groups.some(
          (g: any) => g.name === 'Yo Soy Iglekids' || g.type === KidGroupType.SPECIAL,
        );
        return !hasSpecial;
      }

      // If all/general groups are requested, skip if multiple groups already in memory
      const hasGeneral = groups.length > 1;
      return !hasGeneral;
    },
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
