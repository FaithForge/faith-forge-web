import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { ApiVerbs, makeApiRequest, MS_KID_CHURCH_PATH } from '../../../api';
import { PAGINATION_REGISTRATION_LIMIT } from '../../../constants/pagination';
import { ICreateKid, IUpdateKid } from '../../../models/KidChurch';
import { RootState } from '../../store';

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
    const isNumber =
      typeof Number(payload.findText) === 'number' &&
      !Number.isNaN(Number(payload.findText));
    let filterByFaithForge;
    let filterByFirstName;
    let filterByLastName;

    if (isNumber) {
      filterByFaithForge = payload.findText;
    } else {
      const findArray = payload.findText.split(' ');
      filterByFirstName = findArray[0];
      filterByLastName = findArray[1];
    }

    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_KID_CHURCH_PATH}/kids`, {
        params: {
          limit: PAGINATION_REGISTRATION_LIMIT,
          page: 1,
          registrationChurchMeetingId: churchMeeting.current?.id,
          filterByFirstName,
          filterByLastName,
          filterByFaithForge,
        },
        headers: { Authorization: `Bearer ${token}` },
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
    const isNumber = typeof payload.findText === 'number';

    let filterByFaithForge;
    let filterByFirstName;
    let filterByLastName;
    if (isNumber) {
      filterByFaithForge = payload.findText;
    } else {
      const findArray = payload.findText.split(' ');
      filterByFirstName = findArray[0];
      filterByLastName = findArray[1];
    }

    const response = (
      await makeApiRequest(ApiVerbs.GET, `/${MS_KID_CHURCH_PATH}/kids`, {
        params: {
          limit: PAGINATION_REGISTRATION_LIMIT,
          page: kid.currentPage + 1,
          registrationChurchMeetingId: churchMeeting.current?.id,
          filterByFirstName,
          filterByLastName,
          filterByFaithForge,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;

    return response;
  },
);

export const CreateKid = createAsyncThunk(
  'kid-church/CreateKid',
  async (payload: ICreateKid, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;

    try {
      const response = (
        await makeApiRequest(ApiVerbs.POST, `/${MS_KID_CHURCH_PATH}/kid`, {
          data: {
            ...payload,
          },
          headers: { Authorization: `Bearer ${token}` },
        })
      ).data;

      return response;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.response?.data ?? 'Internal Error');
    }
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
