import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiVerbs, makeApiRequest, MS_USER_PATH } from '../../../api';

export const UserLogin = createAsyncThunk(
  'user/UserLogin',
  async (payload: { username: string; password: string }) => {
    const { username, password } = payload;
    const response = (
      await makeApiRequest(ApiVerbs.POST, `/${MS_USER_PATH}/user/login`, {
        data: {
          username,
          password,
        },
      })
    ).data;

    return response;
  },
);
