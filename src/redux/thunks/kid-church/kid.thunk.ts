import { ApiVerbs, MS_KID_CHURCH_PATH, makeApiRequest } from '@/api';
import { PAGINATION_REGISTRATION_LIMIT } from '@/constants/pagination';
import { ICreateKid, IUpdateKid } from '@/models/KidChurch';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const GetKid = createAsyncThunk(
  'kid-church/GetKid',
  async (payload: { id: string }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchMeeting = state.churchMeetingSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/kid/${payload.id}`,
        {
          params: {
            registrationChurchMeetingId: churchMeeting.current?.id,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    ).data;

    return response;
  },
);

export const GetKids = createAsyncThunk(
  'kid-church/GetKids',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const churchMeeting = state.churchMeetingSlice;
    const { token } = state.authSlice;
    const findArray = payload.findText.split(' ');

    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_KID_CHURCH_PATH}/kids`, {
        params: {
          limit: PAGINATION_REGISTRATION_LIMIT,
          page: 1,
          registrationChurchMeetingId: churchMeeting.current?.id,
          filterByFirstName: findArray[0],
          filterByLastName: findArray[1],
        },
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;
    return response;
  },
);

export const GetMoreKids = createAsyncThunk(
  'kid-church/GetMoreKids',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const kid = state.kidSlice;
    const churchMeeting = state.churchMeetingSlice;
    const { token } = state.authSlice;

    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_KID_CHURCH_PATH}/kids`, {
        params: {
          limit: PAGINATION_REGISTRATION_LIMIT,
          page: kid.currentPage + 1,
          churchMeetingId: churchMeeting.current?.id,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;

    return response;
  },
);

export const CreateKid = createAsyncThunk(
  'kid-church/CreateKid',
  async (payload: { createKid: ICreateKid }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    const { createKid } = payload;
    const response = (
      await makeApiRequest(ApiVerbs.POST, `/${MS_KID_CHURCH_PATH}/kid`, {
        data: {
          ...createKid,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;

    return response;
  },
);

export const UpdateKid = createAsyncThunk(
  'kid-church/UpdateKid',
  async (payload: { id: string; updateKid: IUpdateKid }, { getState }) => {
    const { id, updateKid } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    await makeApiRequest(ApiVerbs.PUT, `/${MS_KID_CHURCH_PATH}/kid/${id}`, {
      data: {
        ...updateKid,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    return updateKid;
  },
);
