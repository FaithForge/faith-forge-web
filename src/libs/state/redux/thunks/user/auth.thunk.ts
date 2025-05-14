import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const UserLogin = createAsyncThunk(
  'user/UserLogin',
  async (payload: { username: string; password: string }) => {
    const { username, password } = payload;
    const response = (
      await microserviceApiRequest({
        microservice: MS.User,
        method: HttpRequestMethod.POST,
        url: `/user/login`,
        options: {
          data: {
            username,
            password,
          },
        },
      })
    ).data;

    return response;
  },
);
