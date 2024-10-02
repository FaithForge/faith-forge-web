import { HttpRequestMethod } from '@faith-forge-web/common-types/global';
import { makeApiRequest } from '@faith-forge-web/utils/http';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { MS_USER_PATH } from '../../../api';

export const UserLogin = createAsyncThunk(
  'user/UserLogin',
  async (payload: { username: string; password: string }) => {
    const { username, password } = payload;
    const response = (
      await makeApiRequest(
        HttpRequestMethod.POST,
        `/${MS_USER_PATH}/user/login`,
        {
          data: {
            username,
            password,
          },
        }
      )
    ).data;

    return response;
  }
);
