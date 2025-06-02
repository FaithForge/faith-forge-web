import { PAGINATION_REGISTRATION_LIMIT } from '@/libs/common-types/constants';
import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { ICreateKid, IUpdateKid } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState } from '../../store';

export const GetKid = createAsyncThunk(
  'kid-church/GetKid',
  async (payload: { id: string }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const churchMeeting = state.churchMeetingSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/kid/${payload.id}`,
        options: {
          params: {
            registrationChurchMeetingId: churchMeeting.current?.id,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
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
            filterByFaithForge,
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
            filterByFaithForge,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
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
        await microserviceApiRequest({
          microservice: MS.KidChurch,
          method: HttpRequestMethod.POST,
          url: `/kid`,
          options: {
            data: {
              ...payload,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
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

    await microserviceApiRequest({
      microservice: MS.KidChurch,
      method: HttpRequestMethod.PUT,
      url: `/kid/${id}`,
      options: {
        data: {
          ...updateKid,
        },
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    return updateKid;
  },
);
