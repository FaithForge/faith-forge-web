import { ApiVerbs, MS_USER_PATH, makeApiRequest } from '@/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const UserLogin = createAsyncThunk(
  'user/UserLogin',
  async (payload: { email: string; password: string }) => {
    const { email, password } = payload;
    const response = (
      await makeApiRequest(ApiVerbs.POST, `/${MS_USER_PATH}/user/login`, {
        data: {
          email,
          password,
        },
      })
    ).data;

    return response;
  },
);
