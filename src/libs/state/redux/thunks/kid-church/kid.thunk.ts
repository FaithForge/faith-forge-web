import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { parseEntitySearchParams } from '@/libs/utils/text';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';


export const GetKids = createAsyncThunk(
  'kid-church/GetKids',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const churchMeeting = state.churchMeetingSlice;
    const { token } = state.authSlice;
    const { filterByFirstName, filterByLastName, numericId } = parseEntitySearchParams(payload.findText);

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kids`,
        options: {
          params: {
            limit: PAGINATION_REGISTRATION_LIMIT,
            page: 1,
            registrationChurchMeetingId: churchMeeting.current?.id,
            filterByFirstName,
            filterByLastName,
            filterByFaithForge: numericId,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);

export const GetMoreKids = createAsyncThunk(
  'kid-church/GetMoreKids',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const kid = state.kidSlice;
    const churchMeeting = state.churchMeetingSlice;
    const { token } = state.authSlice;
    const { filterByFirstName, filterByLastName, numericId } = parseEntitySearchParams(payload.findText);

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kids`,
        options: {
          params: {
            limit: PAGINATION_REGISTRATION_LIMIT,
            page: kid.currentPage + 1,
            registrationChurchMeetingId: churchMeeting.current?.id,
            filterByFirstName,
            filterByLastName,
            filterByFaithForge: numericId,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
);

// Note: GetKid, CreateKid, UpdateKid, and DeleteKid have been migrated to kidChurchApi RTK Query endpoints.
