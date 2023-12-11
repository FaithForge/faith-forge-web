import { ApiVerbs, MS_USER_PATH, makeApiRequest } from '@/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

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
