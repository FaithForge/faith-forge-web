/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpRequestMethod, MS } from '@faith-forge-web/common-types/global';
import { microserviceApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PAGINATION_REGISTRATION_LIMIT } from '../../../constants/pagination';
import { IUpdateUser } from '../../../models/User';
import { RootState } from '../../store';

export const UploadUserImage = createAsyncThunk(
  'user/uploadUserImage',
  async (payload: { formData: any }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.POST,
        url: `/user/upload-image`,
        options: {
          data: payload.formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      })
    ).data;

    return response.key;
  },
);

export const GetUserByNationalId = createAsyncThunk(
  'user/GetUserByNationalId',
  async (nationalId: string, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/user/search-by-national-id`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            nationalId,
          },
        },
      })
    ).data;

    return response;
  },
);

export const GetUserByFullName = createAsyncThunk(
  'user/GetUserByFullName',
  async (payload: { firstName: string; lastName: string }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/user/search-by-full-name`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...payload,
          },
        },
      })
    ).data;

    return response;
  },
);

export const UpdateUser = createAsyncThunk(
  'user/UpdateUser',
  async (payload: { id: string; updateUser: IUpdateUser }, { getState }) => {
    const { id, updateUser } = payload;
    const state = getState() as RootState;
    const { token } = state.authSlice;

    await microserviceApiRequest({
      microservice: MS.User,
      method: HttpRequestMethod.PUT,
      url: `/user/${id}`,
      options: {
        data: {
          ...updateUser,
        },
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    return updateUser;
  },
);

export const GetUsers = createAsyncThunk(
  'user/GetUsers',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const isNumber =
      typeof Number(payload.findText) === 'number' &&
      !Number.isNaN(Number(payload.findText));
    let filterByNationalId;
    let filterByFirstName;
    let filterByLastName;

    if (isNumber) {
      filterByNationalId = payload.findText;
    } else {
      const findArray = payload.findText.split(' ');
      filterByFirstName = findArray[0];
      filterByLastName = findArray[1];
    }

    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/users`,
        options: {
          params: {
            limit: PAGINATION_REGISTRATION_LIMIT,
            page: 1,
            filterByFirstName,
            filterByLastName,
            filterByNationalId,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    return response;
  },
);

export const GetMoreUsers = createAsyncThunk(
  'user/GetMoreUsers',
  async (payload: { findText: string }, { getState }) => {
    const state = getState() as RootState;
    const user = state.userSlice;
    const { token } = state.authSlice;
    const isNumber = typeof payload.findText === 'number';

    let filterByNationalId;
    let filterByFirstName;
    let filterByLastName;
    if (isNumber) {
      filterByNationalId = payload.findText;
    } else {
      const findArray = payload.findText.split(' ');
      filterByFirstName = findArray[0];
      filterByLastName = findArray[1];
    }

    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.GET,
        url: `/users`,
        options: {
          params: {
            limit: PAGINATION_REGISTRATION_LIMIT,
            page: user.currentPage + 1,
            filterByFirstName,
            filterByLastName,
            filterByNationalId,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    return response;
  },
);
