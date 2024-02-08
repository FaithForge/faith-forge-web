import { ApiVerbs, MS_USER_PATH, makeApiRequest } from '@/api';
import { IUpdateUser } from '@/models/User';
import { RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const UploadUserImage = createAsyncThunk(
  'user/uploadUserImage',
  async (payload: { formData: any }, { getState }) => {
    const state = getState() as RootState;
    const { token } = state.authSlice;
    const response = (
      await makeApiRequest(
        ApiVerbs.POST,
        `/${MS_USER_PATH}/user/upload-image`,
        {
          data: payload.formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      )
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
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_USER_PATH}/user/search-by-national-id`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            nationalId,
          },
        },
      )
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
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_USER_PATH}/user/search-by-full-name`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...payload,
          },
        },
      )
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

    await makeApiRequest(ApiVerbs.PUT, `/${MS_USER_PATH}/user/${id}`, {
      data: {
        ...updateUser,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    return updateUser;
  },
);
