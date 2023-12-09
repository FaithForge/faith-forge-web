import {
  ApiVerbs,
  MS_CHURCH_PATH,
  MS_KID_CHURCH_PATH,
  makeApiRequest,
} from '@/api';
import { ICreateKid, IUpdateKid } from '@/models/KidChurch';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const GetKid = createAsyncThunk(
  'kid-church/GetKid',
  async (payload: { id: string }, { getState }) => {
    const state = getState() as RootState;
    const churchMeeting = state.churchMeetingSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_CHURCH_PATH}/kid/${payload.id}`,
        {
          params: {
            registrationChurchMeetingId: churchMeeting.current?.id,
          },
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
    const kid = state.kidSlice;
    const churchMeeting = state.churchMeetingSlice;

    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_CHURCH_PATH}/kids`, {
        params: {
          limit: kid.itemsPerPage,
          page: 1,
          churchMeetingId: churchMeeting.current?.id,
          findText: payload.findText,
        },
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

    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_CHURCH_PATH}/kids`, {
        params: {
          limit: kid.itemsPerPage,
          page: kid.currentPage + 1,
          churchMeetingId: churchMeeting.current?.id,
        },
      })
    ).data;

    return response;
  },
);

export const CreateKid = createAsyncThunk(
  'kid-church/CreateKid',
  async (payload: { createKid: ICreateKid }) => {
    const { createKid } = payload;
    const response = (
      await makeApiRequest(ApiVerbs.POST, `/${MS_KID_CHURCH_PATH}/kid`, {
        data: {
          ...createKid,
        },
      })
    ).data;

    return response;
  },
);

export const UpdateKid = createAsyncThunk(
  'kid-church/UpdateKid',
  async (payload: { id: string; updateKid: IUpdateKid }) => {
    const { id, updateKid } = payload;

    await makeApiRequest(ApiVerbs.PUT, `/${MS_KID_CHURCH_PATH}/kid/${id}`, {
      data: {
        ...updateKid,
      },
    });

    return updateKid;
  },
);
